import NotifyClient from 'notifications-node-client';
import db from '../../models/index.js';
import config from '../../config/app.js';
import jsonConsoleLogger, {unErrorJson} from '../../json-console-logger.js';

const {Registration, Return, NonTargetSpecies, Revocation, Note, RequestUUID} = db;

/**
 * Takes an issue date, calculates an expiry date based on that and converts it
 * in to a formatted string.
 *
 * @param {Date} issueDate when the registration is issued
 * @returns {String} a formatted date string
 */
const buildExpiryDateString = (issueDate) => {
  // Every registration has a 5 year expiry, tied to the issue date of that
  // year's General Licenses. General Licenses are always issued on January 1st,
  // so registrations last for four whole years, plus the rest of the issued
  // year.
  const expiryYear = issueDate.getFullYear() + 4;

  const d = 31;
  const m = 12;
  const y = String(expiryYear).padStart(4, '0');

  return `${d}/${m}/${y}`;
};

/**
 * Send emails to the applicant to let them know it was successful.
 *
 * @param {any} reg an enhanced JSON version of the model
 */
const sendSuccessEmail = async (reg) => {
  if (config.notifyApiKey) {
    try {
      // Every registration has a 5 year expiry, tied to the issue date of that
      // year's General Licenses. General Licenses are always issued on January 1st,
      // so registrations last for four whole years, plus the rest of the issued
      // year.
      const yearExpires = new Date().getFullYear() + 4;
      const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);

      await notifyClient.sendEmail('7b7a0810-a15d-4c72-8fcf-c1e7494641b3', reg.emailAddress, {
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
          expiryDate: `31/12/${yearExpires}`
        },
        reference: reg.regNo,
        emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
      });
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
      throw error;
    }
  }
};

/**
 * An object to perform 'persistence' operations on our registration objects.
 */
const RegistrationController = {
  /**
   * Retrieve the specified registration from the database.
   *
   * @param {Number} id an existing registration's ID
   * @returns an existing registration
   */
  findOne: async (id) =>
    Registration.findByPk(id, {
      include: [
        {
          model: Note
        },
        {model: Revocation, paranoid: false},
        {
          model: Return,
          include: [
            {
              model: NonTargetSpecies
            }
          ],
          paranoid: false
        }
      ],
      paranoid: false
    }),

  /**
   * Retrieve all registrations from the database.
   *
   * @returns {Sequelize.Model} All existing registrations
   */
  findAll: async () =>
    Registration.findAll({
      include: [{model: Revocation}],
      paranoid: false,
      order: [['createdAt', 'DESC']]
    }),

  create: async (reg) => {
    // Check this is the first time we've received this application.
    const isPreviousRequest = await RequestUUID.findOne({where: {uuid: reg.uuid}});

    if (isPreviousRequest) {
      // If this request has already been received return `undefined`.
      return undefined;
    }

    // Add the UUID from the request to the RequestUUID table.
    await RequestUUID.create({uuid: reg.uuid});

    let newReg;
    let remainingAttempts = 10;
    // Loop until we have a new empty registration or we run out of attempts,
    // whichever happens first. We want to wait until we know if an ID is in
    // use here so disable the no-await-in-loop rule.
    /* eslint-disable no-await-in-loop */
    while (newReg === undefined && remainingAttempts > 0) {
      try {
        // Generate a random ID for the registration.
        const regId = Math.floor(Math.random() * 99_999);
        // Begin the database transaction.
        await db.sequelize.transaction(async (t) => {
          // First check if the ID has already been used by another registration.
          newReg = await Registration.findByPk(regId, {transaction: t});
          // If the ID is not in use we can use it.
          if (newReg === null) {
            reg.id = regId;
            newReg = await Registration.create(reg, {transaction: t});
          } else {
            // If the ID is in use set newReg to undefined and try again.
            newReg = undefined;
          }
        });
        remainingAttempts--;
      } catch {
        newReg = undefined;
      }
    }
    /* eslint-enable no-await-in-loop */

    // If we run out of attempts let the calling code know by raising an error.
    if (newReg === undefined) {
      throw new Error('Unable to generate new registration number.');
    }

    // Generate and save  the human-readable version of the reg no.
    newReg.regNo = `NS-TRP-${String(newReg.id).padStart(5, '0')}`;

    // Make the expiry date a user friendly string.
    newReg.dataValues.expiryDate = buildExpiryDateString(new Date());

    // Send the applicant their confirmation email.
    await sendSuccessEmail(newReg);

    // On success, return the new registration's ID.
    return newReg;
  },

  /**
   * Update a registration in the database with partial JSON model.
   *
   * @param {Number} id an existing registration's ID
   * @param {any} reg a JSON version of the model containing only the fields to be updated
   * @returns {boolean} true if the record is updated, otherwise false
   */
  update: async (id, reg) => {
    // Save the new values to the database.
    const result = await Registration.update(reg, {where: {id}});

    // Check to make sure the saving process went OK.
    const success = result.length > 0 && result[0] === 1;
    if (success) {
      // Return JSON with the updated fields on successful update.
      return reg;
    }

    // If something went wrong, return undefined to signify this.
    return undefined;
  },

  /**
   * Soft delete a registration in the database.
   *
   * @param {Number} id a possible ID of a registration.
   * @param {Object} cleanObject a new revocation object to be added to the database.
   * @returns {boolean} true if the record is deleted, otherwise false
   */
  delete: async (id, cleanObject) => {
    try {
      // In order to delete a registration we need to also delete the return record associated with the registration
      // and the Non-Target Species records associated to the returns.
      // Start the transaction.
      await db.sequelize.transaction(async (t) => {
        // Check the registration exists.
        await Registration.findByPk(id, {transaction: t, rejectOnEmpty: true});
        // Find all (if any) associated returns.
        const returns = await Return.findAll({where: {RegistrationId: id}, rejectOnEmpty: false, transaction: t});
        // Create the revocation entry.
        await Revocation.create(cleanObject, {transaction: t});
        // If there was any returns found we need to delete them.
        if (returns) {
          // First we need to create an array of the return ids.
          const returnIds = returns.map((meatBaitReturn) => meatBaitReturn.id);
          // Now we can delete any associated Non-Target Species records as they are child records of a return.
          // Soft Delete any non-Target Species associated to the returns in the returnIds array.
          await NonTargetSpecies.destroy({where: {ReturnId: returnIds}, transaction: t});
          // Now we can soft Delete any returns in the returnIds array.
          await Return.destroy({where: {RegistrationId: id}, transaction: t});
        }

        // Finally we can now soft Delete the parent record, the Registration.
        await Registration.destroy({where: {id}, transaction: t});
        // If everything worked then return true.
        return true;
      });
    } catch {
      // If something during the transaction return false.
      return false;
    }
  }
};

export {RegistrationController as default};
