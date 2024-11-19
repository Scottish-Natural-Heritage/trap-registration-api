import NotifyClient from 'notifications-node-client';
import database from '../../models/index.js';
import config from '../../config/app.js';
import jsonConsoleLogger, {unErrorJson} from '../../json-console-logger.js';
import {
  RETURN_REMINDER_NOTIFY_TEMPLATE_ID,
  PREVIOUS_YEAR_RETURN_NOTIFY_TEMPLATE_ID,
  NEVER_SUBMITTED_RETURN_NOTIFY_TEMPLATE_ID,
  EXPIRED_RECENTLY_NO_RETURN_NOTIFY_TEMPLATE_ID,
  LICENSING_REPLY_TO_NOTIFY_EMAIL_ID,
  TWO_WEEK_EXPIRY_RENEWAL_REMINDER_NOTIFY_TEMPLATE_ID
} from '../../notify-template-ids.js';
import {Op} from 'sequelize';
import {formatRegId, formatDateForEmail} from '../../helper-functions.js';
import {sendTwoWeekExpiryReminderEmail} from '../../notify-emails.js';

const {Registration, Return, Renewal} = database;

const setReturnReminderEmailDetails = (registration) => ({
  id: registration.id,
  lhName: registration.fullName
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

      const validReturnYears = Array.from({length: expiryYear - createdAtYear + 1}, (_, i) => createdAtYear + i);

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

  async findAllDueToExpireInTwoWeeks() {
    // Function to add days and set
    function addDaysAndSetTime(date, days, hours, mins, seconds) {
      const newDate = new Date(date);
      newDate.setDate(date.getDate() + days);
      newDate.setHours(hours, mins, seconds);
      return newDate;
    }

    const fourteenDaysFromNowStart = addDaysAndSetTime(new Date(), 14, 0, 0, 0);
    const fourteenDaysFromNowEnd = addDaysAndSetTime(new Date(), 14, 23, 59, 59);

    return Registration.findAll({
      include: [{model: Return}, {model: Renewal}],
      where: {
        '$Renewals.id$': {[Op.is]: null},
        expiryDate: {[Op.between]: [fourteenDaysFromNowStart, fourteenDaysFromNowEnd], [Op.gt]: new Date()}
      },
      logging: console.log
    });
  },

  async sendTwoWeekExpiryReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;
    const promises = [];

    for (const registration of registrations) {
      const {missingYearsString, returnsDue} = getMissingReturnYears(registration);

      const emailDetails = {
        lhName: registration.fullName,
        regNo: formatRegId(registration.id),
        expiryDate: formatDateForEmail(registration.expiryDate),
        isMeatBait: registration.meatBaits,
        returnsDue: returnsDue,
        years: missingYearsString
      };

      promises.push(sendTwoWeekExpiryReminderEmail(registration.emailAddress, emailDetails));
      sentCount++;
    }

    await Promise.all(promises);
    return sentCount;
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
  }
};

export {ScheduledController as default};
