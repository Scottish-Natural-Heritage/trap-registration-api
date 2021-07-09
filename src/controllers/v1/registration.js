import Sequelize from 'sequelize';
import NotifyClient from 'notifications-node-client';

import db from '../../models/index.js';
import config from '../../config/app.js';

const {Registration, Return, NonTargetSpecies, Revocation} = db;

/**
 * Attempt to create an empty, randomly allocated registration.
 *
 * Generates a random number and attempts to create an empty record in the
 * database with that ID. If it fails because another record already exists,
 * then it returns undefined. If any errors occur, it bubbles them back to the
 * calling code.
 *
 * @returns {Sequelize.Model | undefined} A new empty model is successful,
 * otherwise undefined.
 */
const tryCreate = async () => {
  try {
    // Generate a random 5 digit number and attempt to create a new record with
    // that ID.
    const newReg = await Registration.create({id: Math.floor(Math.random() * 99_999)});

    // X.create only ever returns if it's successful, so we can just return our
    // new model.
    return newReg;
  } catch (error) {
    // There are two possible error conditions here...

    // The first is if we try to create a duplicate ID, which we manually check
    // for and return undefined as an indicator.
    if (error instanceof Sequelize.UniqueConstraintError) {
      return undefined;
    }

    // The second error condition is 'anything else' i.e. a proper DB error. In
    // that case, just throw it up to the calling code.
    throw error;
  }
};

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
        expiryDate: reg.expiryDate
      },
      reference: reg.regNo,
      emailReplyToId: '4a9b34d1-ab1f-4806-83df-3e29afef4165'
    });
  }
};

/**
 * An object to perform 'persistence' operations on our registration objects.
 */
const RegistrationController = {
  /**
   * Create a new randomly allocated registration.
   *
   * Takes up to 10 attempts to create a new empty registration. If it fails, it throws
   *
   * @returns {Number} ID of the new registration
   */
  create: async () => {
    let newReg;
    let remainingAttempts = 10;
    // Loop until we have a new empty registration or we run out of attempts,
    // whichever happens first.
    while (newReg === undefined && remainingAttempts > 0) {
      newReg = await tryCreate(); // eslint-disable-line no-await-in-loop
      remainingAttempts--;
    }

    // If we run out of attempts let the calling code know by raising an error.
    if (newReg === undefined) {
      throw new Error('Unable to generate new registration number.');
    }

    // On success, return the new registration's ID.
    return newReg.id;
  },

  /**
   * Retrieve the specified registration from the database.
   *
   * @param {Number} id an existing registration's ID
   * @returns an existing registration
   */
  findOne: async (id) => {
    return Registration.findByPk(id, {include: [{model: Return, include: NonTargetSpecies}]});
  },

  /**
   * Retrieve all registrations from the database.
   *
   * @returns all existing registrations
   */
  findAll: async () => {
    return Registration.findAll();
  },

  /**
   * Replace a registration in the database with our new JSON model.
   *
   * @param {Number} id an existing registration's ID
   * @param {any} reg a JSON version of the model to replace the database's copy
   * @returns {boolean} true if the record is updated, otherwise false
   */
  update: async (id, reg) => {
    // Save the new values to the database.
    const result = await Registration.update(reg, {where: {id}});

    // Check to make sure the saving process went OK.
    const success = result.length > 0 && result[0] === 1;
    if (success) {
      // Take a copy of the object's fields as we're about to add two extra ones
      // to it.
      const updatedReg = {...reg};

      // Generate and save  the human-readable version of the reg no.
      updatedReg.regNo = `NS-TRP-${String(id).padStart(5, '0')}`;

      // Generate and save the registration's expiry date.
      updatedReg.expiryDate = buildExpiryDateString(new Date());

      // Send the applicant their confirmation email.
      await sendSuccessEmail(updatedReg);

      // Return the updated object to the caller, for them to send back to the
      // client.
      return updatedReg;
    }

    // If something went wrong, return undefined to signify this.
    return undefined;
  },

  /**
   * Soft delete a registration in the database.
   *
   * @param {Number} id a possible ID of a registration.
   * @param {Object} cleanObject an new revocation object to be added to the database.
   * @returns {boolean} true if the record is deleted, otherwise false
   */
  delete: async (id, cleanObject) => {
    try {
      await db.sequelize.transaction(async (t) => {
        await Registration.findByPk(id, {transaction: t, rejectOnEmpty: true});
        await Revocation.create(cleanObject, {transaction: t});
        await Registration.destroy({where: {id}, transaction: t});
        return true;
      });
    } catch {
      return false;
    }
  }
};

export {RegistrationController as default};
