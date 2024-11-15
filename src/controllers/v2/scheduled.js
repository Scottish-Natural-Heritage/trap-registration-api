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

const setReturnReminderEmailDetails = (registration) => ({
  id: registration.id,
  lhName: registration.fullName
});

const setRenewalReminderEmailDetails = (registration) => ({
  id: registration.id,
  lhName: registration.fullName,
  expiry: registration.expiryDate,
  hasMeatBaits: registration.meatbaits
});

const setPreviousYearReturnReminderEmailDetails = (registration) => ({
  id: registration.id,
  lhName: registration.fullName,
  PreviousYear: new Date().getFullYear() - 1
});

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

  async sendExpiredNoRenewalsReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    const promises = [];

    for (const registration of registrations) {
      const emailDetails = setRenewalReminderEmailDetails(registration);

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
