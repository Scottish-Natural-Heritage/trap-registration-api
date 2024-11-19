import NotifyClient from 'notifications-node-client';
import config from './config/app.js';
import jsonConsoleLogger, {unErrorJson} from './json-console-logger.js';
import {
  TRAP_REGISTRATION_CONFIRMATION_NOTIFY_TEMPLATE_ID,
  LICENSING_REPLY_TO_NOTIFY_EMAIL_ID
} from './notify-template-ids.js';

/**
 * Send emails to the applicant to let them know it was successful.
 *
 * @param {any} reg an enhanced JSON version of the model
 */
export const sendSuccessEmail = async (reg) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      await notifyClient.sendEmail(TRAP_REGISTRATION_CONFIRMATION_NOTIFY_TEMPLATE_ID, reg.emailAddress, {
        personalisation: {
          regNo: reg.regNo,
          convictions: reg.convictions ? 'yes' : 'no',
          noConvictions: reg.convictions ? 'no' : 'yes',
          general1: reg.usingGL01 ? 'yes' : 'no',
          noGeneral1: reg.usingGL01 ? 'no' : 'yes',
          general2: reg.usingGL02 ? 'yes' : 'no',
          noGeneral2: reg.usingGL02 ? 'no' : 'yes',
          comply: reg.complyWithTerms ? 'yes' : 'no',
          noComply: reg.complyWithTerms ? 'no' : 'yes',
          meatBait: reg.meatBaits ? 'yes' : 'no',
          noMeatBait: reg.meatBaits ? 'no' : 'yes',
          expiryDate: reg.expiryDate ?? 'TBC'
        },
        reference: reg.regNo,
        emailReplyToId: LICENSING_REPLY_TO_NOTIFY_EMAIL_ID
      });
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
      throw error;
    }
  }
};

/**
 * Send emails to the applicant to let them know it was successful.
 *
 * @param {string} emailAddress Registration holder's email address.
 * @param {any} emailDetails Object containing personalisation data for notify
 */
export const sendTwoWeekExpiryReminderEmail = async (emailAddress, emailDetails, notifyTemplate) => {
  if (config.notifyApiKey) {
    try {
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      const {lhName, regNo, expiryDate, isMeatBait, returnsDue, years} = emailDetails;

      await notifyClient.sendEmail(notifyTemplate, emailAddress, {
        personalisation: {
          lhName,
          regNo,
          expiryDate,
          isMeatBait,
          returnsDue,
          years
        },
        reference: regNo,
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
 */
export const sendRenewalReminderEmail = async (emailDetails, emailAddress, notifyTemplate) => {
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
 * Send reminder email to applicant informing them their returns
 * are due.
 *
 * @param {string} emailDetails The details to use in personalisation of email.
 * @param {any} emailAddress The email address of the recipient.
 * @param {string} notifyTemplate The Notify template to use for the email.
 */
export const sendReturnReminderEmail = async (emailDetails, emailAddress, notifyTemplate) => {
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
