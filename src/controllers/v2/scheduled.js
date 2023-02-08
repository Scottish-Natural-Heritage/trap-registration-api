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
  }

};

export {ScheduledController as default};
