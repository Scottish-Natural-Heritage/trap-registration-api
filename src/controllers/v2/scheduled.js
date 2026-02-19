import NotifyClient from 'notifications-node-client';
import database from '../../models/index.js';
import config from '../../config/app.js';
import jsonConsoleLogger, {unErrorJson} from '../../json-console-logger.js';
import {
  RETURN_REMINDER_NOTIFY_TEMPLATE_ID,
  PREVIOUS_YEAR_RETURN_NOTIFY_TEMPLATE_ID,
  NEVER_SUBMITTED_RETURN_NOTIFY_TEMPLATE_ID,
  EXPIRED_RECENTLY_NO_RETURN_NOTIFY_TEMPLATE_ID,
  LICENSING_REPLY_TO_NOTIFY_EMAIL_ID
} from '../../notify-template-ids.js';

const {Registration, Return, Revocation, Note} = database;
const {Op} = database.Sequelize;

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

  /**
   * Soft-delete registrations that are older than 5 years.
   *
   * Non-revoked registrations whose expiryDate is more than 5 years ago.
   * Revoked registrations whose Revocation.createdAt is more than 5 years ago (notes only).
   *
   * @returns {Object} Summary of what was deleted.
   */
  async softDeleteExpiredRegistrations() {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);

    const summary = {
      expiredRegistrationsDeleted: 0,
      expiredNotesDeleted: 0,
      revokedNotesDeleted: 0
    };

    const obfuscatedData = {
      fullName: 'REDACTED',
      emailAddress: 'redacted@redacted.redacted',
      phoneNumber: 'REDACTED',
      addressLine1: 'REDACTED',
      addressLine2: null,
      addressTown: 'REDACTED',
      addressCounty: null
    };

    // Registrations with expiryDate > 5 years ago.
    const expiredRegistrations = await Registration.findAll({
      where: {
        expiryDate: {[Op.lt]: fiveYearsAgo}
      },
      include: [{model: Revocation, required: false}]
    });

    /* eslint-disable no-await-in-loop */
    for (const registration of expiredRegistrations) {
      if (registration.Revocation && registration.Revocation.isRevoked === true) {
        continue;
      }

      try {
        await database.sequelize.transaction(async (t) => {
          await Registration.update(obfuscatedData, {where: {id: registration.id}, transaction: t});
          const notesDeleted = await Note.destroy({where: {RegistrationId: registration.id}, transaction: t});
          await Registration.destroy({where: {id: registration.id}, transaction: t});
          summary.expiredNotesDeleted += notesDeleted;
          summary.expiredRegistrationsDeleted++;
        });
      } catch (error) {
        jsonConsoleLogger.error(unErrorJson(error));
      }
    }
    /* eslint-enable no-await-in-loop */

    // revoked registrations
    const revokedRegistrations = await Registration.findAll({
      paranoid: false,
      include: [
        {
          model: Revocation,
          required: true,
          paranoid: false,
          where: {
            isRevoked: true,
            createdAt: {[Op.lt]: fiveYearsAgo}
          }
        }
      ]
    });

    /* eslint-disable no-await-in-loop */
    for (const registration of revokedRegistrations) {
      try {
        await database.sequelize.transaction(async (t) => {
          await Registration.update(obfuscatedData, {
            where: {id: registration.id},
            transaction: t,
            paranoid: false
          });
          const notesDeleted = await Note.destroy({where: {RegistrationId: registration.id}, transaction: t});
          summary.revokedNotesDeleted += notesDeleted;
        });
      } catch (error) {
        jsonConsoleLogger.error(unErrorJson(error));
      }
    }
    /* eslint-enable no-await-in-loop */

    return summary;
  }
};

export {ScheduledController as default};
