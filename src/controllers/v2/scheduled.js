import NotifyClient from 'notifications-node-client';
import database from '../../models/index.js';
import config from '../../config/app.js';
import jsonConsoleLogger, {unErrorJson} from '../../json-console-logger.js';

const {Registration, Return} = database;

const setReturnReminderEmailDetails = (registration) => {
  return {
    id: registration.id,
    lhName: registration.fullName
  };
};

const setPreviousYearReturnReminderEmailDetails = (registration) => {
  return {
    id: registration.id,
    lhName: registration.fullName,
    PreviousYear: new Date().getFullYear() - 1
  };
};

/**
 * Send reminder email to applicant informing them their returns
 * are due.
 *
 * @param {string} emailDetails The details to use in personalisation of email.
 * @param {any} emailAddress The email address of the recipient.
 */
const sendReturnReminderEmail = async (emailDetails, emailAddress) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      // Send the email via notify.
      await notifyClient.sendEmail('18e9ce0c-ea52-4c70-a5ef-01ef16590d8c', emailAddress, {
        personalisation: emailDetails,
        emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
      });
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
      throw error;
    }
  }
};

/**
 * Send reminder email to applicant informing them their returns
 * are due for the previous year.
 *
 * @param {string} emailDetails The details to use in personalisation of email.
 * @param {any} emailAddress The email address of the recipient.
 */
const sendPreviousYearReturnReminderEmail = async (emailDetails, emailAddress) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      // Send the email via notify.
      await notifyClient.sendEmail('5223cf17-75e1-4ee6-b0b1-93fd4d4da8df', emailAddress, {
        personalisation: emailDetails,
        emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
      });
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
      throw error;
    }
  }
};

/**
 * Send reminder email to applicant informing them they have never
 * submitted any returns against their licence.
 *
 * @param {string} emailDetails The details to use in personalisation of email.
 * @param {any} emailAddress The email address of the recipient.
 */
const sendNoReturnReminderEmail = async (emailDetails, emailAddress) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      // Send the email via notify.
      await notifyClient.sendEmail('9318c092-aaea-4df2-ad04-e909cce8a683', emailAddress, {
        personalisation: emailDetails,
        emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
      });
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
      throw error;
    }
  }
};

/**
 * Send reminder email to applicant informing them they have never
 * submitted any returns against their recently expired licence.
 *
 * @param {string} emailDetails The details to use in personalisation of email.
 * @param {any} emailAddress The email address of the recipient.
 */
const sendExpiredNoReturnReminderEmail = async (emailDetails, emailAddress) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      // Send the email via notify.
      await notifyClient.sendEmail('7f80c081-bf2b-4f23-a7db-6ac581888b44', emailAddress, {
        personalisation: emailDetails,
        emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
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

    for (const registration of registrations) {
      const emailDetails = setReturnReminderEmailDetails(registration);

      // eslint-disable-next-line no-await-in-loop
      await sendReturnReminderEmail(emailDetails, registration.emailAddress);
      sentCount++;
    }

    return sentCount;
  },

  async sendPreviousYearReturnReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    for (const registration of registrations) {
      const emailDetails = setPreviousYearReturnReminderEmailDetails(registration);

      // eslint-disable-next-line no-await-in-loop
      await sendPreviousYearReturnReminderEmail(emailDetails, registration.emailAddress);
      sentCount++;
    }

    return sentCount;
  },

  async sendNoReturnReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    for (const registration of registrations) {
      const emailDetails = setReturnReminderEmailDetails(registration);

      // eslint-disable-next-line no-await-in-loop
      await sendNoReturnReminderEmail(emailDetails, registration.emailAddress);
      sentCount++;
    }

    return sentCount;
  },

  async sendExpiredNoReturnReminder(registrations) {
    // A count of the number of emails sent.
    let sentCount = 0;

    for (const registration of registrations) {
      const emailDetails = setReturnReminderEmailDetails(registration);

      // eslint-disable-next-line no-await-in-loop
      await sendExpiredNoReturnReminderEmail(emailDetails, registration.emailAddress);
      sentCount++;
    }

    return sentCount;
  }
};

export {ScheduledController as default};
