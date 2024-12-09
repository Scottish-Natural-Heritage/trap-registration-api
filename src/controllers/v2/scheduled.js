import {Op} from 'sequelize';
import database from '../../models/index.js';
import {
  RETURN_REMINDER_NOTIFY_TEMPLATE_ID,
  PREVIOUS_YEAR_RETURN_NOTIFY_TEMPLATE_ID,
  NEVER_SUBMITTED_RETURN_NOTIFY_TEMPLATE_ID,
  EXPIRED_RECENTLY_NO_RETURN_NOTIFY_TEMPLATE_ID,
  TWO_WEEK_EXPIRY_RENEWAL_REMINDER_NOTIFY_TEMPLATE_ID,
  EXPIRED_RECENTLY_NO_RENEWALS_NOTIFY_TEMPLATE_ID
} from '../../notify-template-ids.js';
import {formatRegId, formatDateForEmail, addDaysSetTime} from '../../helper-functions.js';
import {
  sendTwoWeekExpiryReminderEmail,
  sendRenewalReminderEmail,
  sendReturnReminderEmail
} from '../../notify-emails.js';

const {Registration, Return, Renewal} = database;

const setReturnReminderEmailDetails = (registration) => ({
  id: registration.trapId,
  lhName: registration.fullName
});

const setRenewalReminderEmailDetails = (registration, missingYearsString, returnsDue) => ({
  id: registration.trapId,
  lhName: registration.fullName,
  expiry: formatDateForEmail(registration.expiryDate),
  year: missingYearsString,
  hasMeatBaits: registration.meatBaits,
  returnsDue
});

const setPreviousYearReturnReminderEmailDetails = (registration) => ({
  id: registration.trapId,
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
  let years = '';

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

      years = returnsDue ? missingYears.join(', ') : '';
    }
  }

  return {
    years,
    returnsDue
  };
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
    const todaysDate = new Date();
    const fourteenDaysFromNowStart = addDaysSetTime(todaysDate, 14, 0, 0, 0);
    const fourteenDaysFromNowEnd = addDaysSetTime(todaysDate, 14, 23, 59, 59);

    return Registration.findAll({
      include: [
        {model: Return, required: false},
        {model: Renewal, required: false}
      ],
      where: {
        expiryDate: {[Op.between]: [fourteenDaysFromNowStart, fourteenDaysFromNowEnd], [Op.gt]: new Date()}
      }
    });
  },
  /**
   * Retrieve all registrations from the database that are expired.
   *
   * @returns {Sequelize.Model} All registrations that are expired.
   */
  async findAllExpiredNoRenewals() {
    const todaysDate = new Date();
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

  async sendTwoWeekExpiryReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;
    const promises = [];

    for (const registration of registrations) {
      const {years, returnsDue} = getMissingReturnYears(registration);

      const emailDetails = {
        lhName: registration.fullName,
        regNo: formatRegId(registration.trapId),
        expiryDate: formatDateForEmail(registration.expiryDate),
        isMeatBait: registration.meatBaits,
        returnsDue,
        years
      };

      promises.push(
        sendTwoWeekExpiryReminderEmail(
          registration.emailAddress,
          emailDetails,
          TWO_WEEK_EXPIRY_RENEWAL_REMINDER_NOTIFY_TEMPLATE_ID
        )
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
      const {years, returnsDue} = getMissingReturnYears(registration);
      const emailDetails = setRenewalReminderEmailDetails(registration, years, returnsDue);

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
