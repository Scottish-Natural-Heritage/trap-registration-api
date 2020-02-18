// eslint-disable-next-line unicorn/import-index, import/no-useless-path-segments
import db from '../models/index.js';
import Sequelize from 'sequelize';
import NotifyClient from 'notifications-node-client';
import config from '../config/app.js';

const {Registration} = db;

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
    const newReg = await Registration.create({id: Math.floor(Math.random() * 99999)});

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
  const expiryDateTime = new Date(issueDate);
  expiryDateTime.setFullYear(expiryDateTime.getFullYear() + 5);

  const d = String(expiryDateTime.getDate()).padStart(2, '0');
  const m = String(expiryDateTime.getMonth() + 1).padStart(2, '0');
  const y = String(expiryDateTime.getFullYear()).padStart(4, '0');

  return `${d}/${m}/${y}`;
};

/**
 * Send emails to the applicant and the internal system to let everyone know it
 * was successful.
 *
 * @param {Number} id an existing registration's ID
 * @param {any} reg a JSON version of the model to replace the database's copy
 */
const sendSuccessEmails = async (id, reg) => {
  const notifyClient = new NotifyClient.NotifyClient(config.notifyApiKey);
  const regNo = `NS-TRP-${String(id).padStart(5, '0')}`;

  const registrationDateTime = new Date();
  const expiryDate = buildExpiryDateString(registrationDateTime);

  // Send an email to the applicant, confirming their registration.
  await notifyClient.sendEmail('7b7a0810-a15d-4c72-8fcf-c1e7494641b3', 'traps@nature.scot', {
    personalisation: {
      regNo,
      convictions: reg.convictions ? 'yes' : 'no',
      noConvictions: reg.convictions ? 'no' : 'yes',
      general1: reg.usingGL01 ? 'yes' : 'no',
      noGeneral1: reg.usingGL01 ? 'no' : 'yes',
      general2: reg.usingGL02 ? 'yes' : 'no',
      noGeneral2: reg.usingGL02 ? 'no' : 'yes',
      general3: reg.usingGL03 ? 'yes' : 'no',
      noGeneral3: reg.usingGL03 ? 'no' : 'yes',
      comply: reg.complyWithTerms ? 'yes' : 'no',
      noComply: reg.complyWithTerms ? 'no' : 'yes',
      meatBait: reg.meatBaits ? 'yes' : 'no',
      noMeatBait: reg.meatBaits ? 'no' : 'yes',
      expiryDate
    },
    reference: regNo,
    emailReplyToId: '4a9b34d1-ab1f-4806-83df-3e29afef4165'
  });

  // Send an email to us, logging all their details.
  await notifyClient.sendEmail('59b7f2f3-b152-405a-9441-c8633fc45399', 'traps@nature.scot', {
    personalisation: {
      regNo,
      convictions: reg.convictions ? 'yes' : 'no',
      general1: reg.usingGL01 ? 'yes' : 'no',
      general2: reg.usingGL02 ? 'yes' : 'no',
      general3: reg.usingGL03 ? 'yes' : 'no',
      comply: reg.complyWithTerms ? 'yes' : 'no',
      meatBait: reg.meatBaits ? 'yes' : 'no',
      fullName: reg.fullName,
      addressLine1: reg.addressLine1,
      addressLine2: reg.addressLine2,
      addressTown: reg.addressTown,
      addressCounty: reg.addressCounty,
      addressPostcode: reg.addressPostcode,
      phoneNumber: reg.phoneNumber,
      emailAddress: reg.emailAddress,
      registrationDateTime: registrationDateTime.toISOString()
    },
    reference: regNo,
    emailReplyToId: '4a9b34d1-ab1f-4806-83df-3e29afef4165'
  });
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
    return Registration.findByPk(id);
  },

  /**
   * Replace a registration in the database with our new JSON model.
   *
   * @param {Number} id an existing registration's ID
   * @param {any} reg a JSON version of the model to replace the database's copy
   * @returns {boolean} true if the record is updated, otherwise false
   */
  update: async (id, reg) => {
    const result = await Registration.update(reg, {where: {id}});
    const success = result.length > 0 && result[0] === 1;
    if (success) {
      await sendSuccessEmails(id, reg);
    }

    return success;
  }
};

export {RegistrationController as default};
