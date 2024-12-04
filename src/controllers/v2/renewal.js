import utils from 'naturescot-utils';
import db from '../../models/index.js';
import {sendSuccessEmail} from '../../notify-emails.js';
import RegistrationController from './registration.js';

const {Renewal, Registration} = db;

/**
 * Every registration has a 5 year expiry, tied to the issue date of that
 * year's General Licenses. General Licenses are always issued on January 1st,
 * so registrations last for four whole years, plus the rest of the issued
 * year.
 * @returns {Date} the calculated expiry date
 */
const calculateExpiryDate = () => {
  // Get the current date.
  const expiryDate = new Date();
  // Add 4 years.
  expiryDate.setFullYear(expiryDate.getFullYear() + 4);
  // Set the month to December and the day to the 31st and return the updated date.
  return expiryDate.setMonth(11, 31);
};

/**
 * Clean the incoming POST request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} body the incoming request's body
 * @returns {any} a json object that's just got our cleaned up fields on it
 */
const cleanInput = (body) => ({
  // The booleans are just copied across.
  convictions: body.convictions,
  usingGL01: body.usingGL01,
  usingGL02: body.usingGL02,
  usingGL03: null,
  complyWithTerms: body.complyWithTerms,
  meatBaits: body.meatBaits,
  createdByLicensingOfficer: body.createdByLicensingOfficer,
  // The strings are trimmed for leading and trailing whitespace and then
  // copied across if they're in the POST body or are set to undefined if
  // they're missing.
  fullName: body.fullName === undefined ? undefined : body.fullName.trim(),
  addressLine1: body.addressLine1 === undefined ? undefined : body.addressLine1.trim(),
  addressLine2: body.addressLine2 === undefined ? undefined : body.addressLine2.trim(),
  addressTown: body.addressTown === undefined ? undefined : body.addressTown.trim(),
  addressCounty: body.addressCounty === undefined ? undefined : body.addressCounty.trim(),
  addressPostcode: body.addressPostcode === undefined ? undefined : body.addressPostcode.trim(),
  phoneNumber: body.phoneNumber === undefined ? undefined : body.phoneNumber.trim(),
  emailAddress:
    body.emailAddress === undefined
      ? undefined
      : utils.formatters.stripAndRemoveObscureWhitespace(body.emailAddress.toLowerCase()),
  uprn: body.uprn === undefined ? undefined : String(body.uprn),
  expiryDate: calculateExpiryDate(),
  uuid: body.uuid
});

const RenewalController = {
  /**
   * Retrieve the specified Renewal from the database.
   *
   * @param {Number} id a Renewal's ID
   * @returns a Renewal
   */
  findOne: async (id) => Renewal.findByPk(id),

  /**
   * Retrieve all Renewals from the database.
   *
   * @returns all Renewals
   */
  findAll: async () => Renewal.findAll(),

  findAllForRegistration: async (registrationId) => {
    if (Number.isNaN(registrationId)) {
      return {status: 404, id: registrationId};
    }

    const registration = await Registration.findByPk(registrationId);

    return Registration.findAll({where: {trapId: registration.trapId, registrationType: 'Renewal'}});
  },

  /**
   * Create a new Renewal.
   *
   * @returns Object with keys status: number, message: string
   */
  create: async (request) => {
    // Try to parse the incoming ID to make sure it's really a number.
    const registrationNumber = Number.parseInt(request.params.id, 10);

    if (Number.isNaN(registrationNumber)) {
      return {status: 404, id: registrationNumber};
    }

    // Check if there's a registration allocated at the specified ID.
    const findOneRegistrationResponse = await RegistrationController.findOne(registrationNumber);
    if (findOneRegistrationResponse === undefined || findOneRegistrationResponse === null) {
      return {status: 404, id: registrationNumber};
    }

    const existingReg = findOneRegistrationResponse;

    const mappedExistingReg = {
      convictions: existingReg?.convictions,
      usingGL01: existingReg?.usingGL01,
      usingGL02: existingReg?.usingGL02,
      usingGL03: existingReg?.usingGL03,
      complyWithTerms: existingReg?.complyWithTerms,
      meatBaits: existingReg?.meatBaits,
      fullName: existingReg?.fullName,
      addressLine1: existingReg?.addressLine1,
      addressLine2: existingReg?.addressLine2,
      addressTown: existingReg?.addressTown,
      addressCounty: existingReg?.addressCounty,
      addressPostcode: existingReg?.addressPostcode,
      phoneNumber: existingReg?.phoneNumber,
      emailAddress: existingReg?.emailAddress,
      uprn: existingReg?.uprn
    };

    // Clean up the user's input before we store it in the database.
    const cleanObject = cleanInput(request.body);

    const mappedCleanObject = {
      convictions: cleanObject?.convictions,
      usingGL01: cleanObject?.usingGL01,
      usingGL02: cleanObject?.usingGL02,
      usingGL03: cleanObject?.usingGL03,
      complyWithTerms: cleanObject?.complyWithTerms,
      meatBaits: cleanObject?.meatBaits,
      fullName: cleanObject?.fullName,
      addressLine1: cleanObject?.addressLine1,
      addressLine2: cleanObject?.addressLine2,
      addressTown: cleanObject?.addressTown,
      addressCounty: cleanObject?.addressCounty,
      addressPostcode: cleanObject?.addressPostcode,
      phoneNumber: cleanObject?.phoneNumber,
      emailAddress: cleanObject?.emailAddress,
      uprn: cleanObject?.uprn
    };

    const changes = {};

    // Check if there are any changes from the original
    for (const key in mappedExistingReg) {
      if (mappedExistingReg[key] !== mappedCleanObject[key]) {
        changes[key] = mappedCleanObject[key];
      }
    }

    let renewalRegistration;

    await db.sequelize.transaction(async (t) => {
      try {
        const initialRegistration = await Registration.findByPk(registrationNumber);

        await Registration.update(
          {...changes, expiryDate: null},
          {where: {trapId: initialRegistration.trapId}, transaction: t}
        );
        renewalRegistration = await Registration.create(
          {...mappedCleanObject, trapId: initialRegistration.trapId, registrationType: 'Renewal'},
          {transaction: t}
        );
      } catch (error) {
        console.log(error);
        return {status: 500, id: registrationNumber};
      }
    });

    const notifyDetails = {
      regNo: `NS-TRP-${String(renewalRegistration.trapId).padStart(5, '0')}`,
      usingGL01: renewalRegistration?.usingGL01,
      usingGL02: renewalRegistration?.usingGL02,
      convictions: renewalRegistration?.convictions,
      complyWithTerms: renewalRegistration?.complyWithTerms,
      meatBaits: renewalRegistration?.meatBaits,
      emailAddress: renewalRegistration?.emailAddress,
      expiryDate: null
    };

    // Send the applicant their renewal confirmation email.
    await sendSuccessEmail(notifyDetails);

    return {status: 201, id: renewalRegistration.id};
  }
};

export {RenewalController as default};
