import NotifyClient from 'notifications-node-client';
import {Op} from 'sequelize';
import database from '../../models/index.js';
import config from '../../config/app.js';
import jsonConsoleLogger, {unErrorJson} from '../../json-console-logger.js';
import {
  RETURN_REMINDER_NOTIFY_TEMPLATE_ID,
  PREVIOUS_YEAR_RETURN_NOTIFY_TEMPLATE_ID,
  NEVER_SUBMITTED_RETURN_NOTIFY_TEMPLATE_ID,
  EXPIRED_RECENTLY_NO_RETURN_NOTIFY_TEMPLATE_ID,
  LICENSING_REPLY_TO_NOTIFY_EMAIL_ID,
  EXPIRED_RECENTLY_NO_RENEWALS_NOTIFY_TEMPLATE_ID
} from '../../notify-template-ids.js';

const {Registration, Return, Renewal} = database;

/**
 * Split a date object into day, month and year and format for output.
 * The month is written out in full.
 *
 * @param {Date} date A Date object.
 * @returns {string} Returns a string containing the day, month and year.
 */
const formatDateForEmail = (date) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const day = date.getDate().toString().padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString();
  return `${day} ${month} ${year}`;
};

const setReturnReminderEmailDetails = (registration) => ({
  id: registration.id,
  lhName: registration.fullName
});

const setRenewalReminderEmailDetails = (registration, missingYearsString, returnsDue) => ({
  id: registration.id,
  lhName: registration.fullName,
  expiry: formatDateForEmail(registration.expiryDate),
  year: missingYearsString,
  hasMeatBaits: registration.meatBaits,
  returnsDue
});

const setPreviousYearReturnReminderEmailDetails = (registration) => ({
  id: registration.id,
  lhName: registration.fullName,
  PreviousYear: new Date().getFullYear() - 1
});

/**
 * Get the years that the user is missing returns for.
 *
 *
 * @param {any} registration Registration object.
 * @returns {any} The missing years as a string and a boolean value if returns are due.
 */
const getMissingReturnYears = (registration) => {
  // This is used in the notify email for the list of returns required to be submitted by the user.
  // Set this to an empty string for, set to list of year[s] if a meat bait trap and return[s] is required.
  let missingYearsString = '';

  // Also for use in the notify template
  let returnsDue = false;

  // Check if user has meat baits and if returns are missing.
  if (registration.meatBaits) {
    const createdAtYear = new Date(registration.createdAt).getFullYear();
    const expiryYear = new Date(registration.expiryDate).getFullYear();

    // Year returns are done only started to get asked in 2022
    const startYearOfReturns = 2022;
    // Creates a range of years from year licence was created to the year it expired.
    const licenceActiveYears = Array.from({length: expiryYear - createdAtYear + 1}, (_value, i) => createdAtYear + i);

    const validForReturns = licenceActiveYears.includes(startYearOfReturns) || createdAtYear >= startYearOfReturns;

    if (validForReturns) {
      const submittedYears = new Set(registration.Returns.map((r) => Number(r.year)));

      const validReturnYears = Array.from(
        {length: expiryYear - startYearOfReturns + 1},
        (_, i) => startYearOfReturns + i
      );

      const missingYears = validReturnYears.filter((year) => !submittedYears.has(year));

      returnsDue = missingYears.length > 0;

      missingYearsString = returnsDue ? missingYears.join(', ') : '';
    }
  }

  return {
    missingYearsString,
    returnsDue
  };
};

/**
 * Send reminder email to applicant informing them their returns
 * are due.
 *
 * @param {string} emailDetails The details to use in personalisation of email.
 * @param {any} emailAddress The email address of the recipient.
 * @param {string} notifyTemplate The Notify template to use for the email.
 */
const sendReturnReminderEmail = async (emailDetails, emailAddress, notifyTemplate) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      // Send the email via notify.
      await notifyClient.sendEmail(notifyTemplate, emailAddress, {
        personalisation: emailDetails,
        emailReplyToId: LICENSING_REPLY_TO_NOTIFY_EMAIL_ID
      });
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
      throw error;
    }
  }
};

/**
 * Send reminder email to applicant informing them that they can renew their application
 *
 * @param {string} emailDetails The details to use in personalisation of email.
 * @param {any} emailAddress The email address of the recipient.
 * @param {string} notifyTemplate The Notify template to use for the email.
 */
const sendRenewalReminderEmail = async (emailDetails, emailAddress, notifyTemplate) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      // Send the email via notify.
      await notifyClient.sendEmail(notifyTemplate, emailAddress, {
        personalisation: emailDetails,
        emailReplyToId: LICENSING_REPLY_TO_NOTIFY_EMAIL_ID
      });
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
      throw error;
    }
  }
};

const ScheduledController = {
  /**
   * Retrieve all registrations from the database. Include returns.
   * Used to decide which email addresses need reminder emails sent.
   *
   * @returns  {Sequelize.Model} All existing registrations.
   */
  async findAll() {
    return Registration.findAll({
      include: [{model: Return}]
    });
  },

  /**
   * Retrieve all registrations from the database that are expired.
   *
   * @returns {Sequelize.Model} All registrations that are expired.
   */
  async findAllExpiredNoRenewals(todaysDate) {
    // Function to Add days to current date
    function addDaysSetTime(date, days, hours, mins, seconds) {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + days);
      newDate.setHours(hours, mins, seconds);
      return newDate;
    }

    const startOfDay = addDaysSetTime(todaysDate, -1, 0, 0, 0);
    const endOfDay = addDaysSetTime(todaysDate, -1, 23, 59, 59);

    return Registration.findAll({
      include: [
        {
          model: Renewal,
          required: false
        },
        {model: Return, required: false}
      ],
      where: {
        expiryDate: {
          [Op.between]: [startOfDay, endOfDay]
        },
        '$Renewals.id$': {[Op.is]: null}
      }
    });
  },

  async sendReturnReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;
    const promises = [];

    for (const registration of registrations) {
      const emailDetails = setReturnReminderEmailDetails(registration);

      promises.push(
        sendReturnReminderEmail(emailDetails, registration.emailAddress, RETURN_REMINDER_NOTIFY_TEMPLATE_ID)
      );
      sentCount++;
    }

    await Promise.all(promises);

    return sentCount;
  },

  async sendPreviousYearReturnReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    const promises = [];

    for (const registration of registrations) {
      const emailDetails = setPreviousYearReturnReminderEmailDetails(registration);

      promises.push(
        sendReturnReminderEmail(emailDetails, registration.emailAddress, PREVIOUS_YEAR_RETURN_NOTIFY_TEMPLATE_ID)
      );
      sentCount++;
    }

    await Promise.all(promises);

    return sentCount;
  },

  async sendNoReturnReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    const promises = [];

    for (const registration of registrations) {
      const emailDetails = setReturnReminderEmailDetails(registration);

      promises.push(
        sendReturnReminderEmail(emailDetails, registration.emailAddress, NEVER_SUBMITTED_RETURN_NOTIFY_TEMPLATE_ID)
      );
      sentCount++;
    }

    await Promise.all(promises);

    return sentCount;
  },

  async sendExpiredNoReturnReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    const promises = [];

    for (const registration of registrations) {
      const emailDetails = setReturnReminderEmailDetails(registration);

      promises.push(
        sendReturnReminderEmail(emailDetails, registration.emailAddress, EXPIRED_RECENTLY_NO_RETURN_NOTIFY_TEMPLATE_ID)
      );
      sentCount++;
    }

    await Promise.all(promises);

    return sentCount;
  },

  async sendExpiredNoRenewalsReminder(expiredRegistrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    const promises = [];

    for (const registration of expiredRegistrations) {
      const {missingYearsString, returnsDue} = getMissingReturnYears(registration);
      const emailDetails = setRenewalReminderEmailDetails(registration, missingYearsString, returnsDue);

      promises.push(
        sendRenewalReminderEmail(
          emailDetails,
          registration.emailAddress,
          EXPIRED_RECENTLY_NO_RENEWALS_NOTIFY_TEMPLATE_ID
        )
      );
      sentCount++;
    }

    await Promise.all(promises);

    return sentCount;
  }
};

export {ScheduledController as default};
