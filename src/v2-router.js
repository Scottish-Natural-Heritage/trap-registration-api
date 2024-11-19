import express from 'express';
import utils from 'naturescot-utils';
import jwt from 'jsonwebtoken';
import NotifyClient from 'notifications-node-client';
import Registration from './controllers/v2/registration.js';
import RenewalController from './controllers/v2/renewal.js';
import ScheduledController from './controllers/v2/scheduled.js';
import Return from './controllers/v2/return.js';
import config from './config/app.js';
import jsonConsoleLogger, {unErrorJson} from './json-console-logger.js';
import Note from './controllers/v2/note.js';

import jwk from './config/jwk.js';

const v2Router = express.Router();

const hasReturnForPreviousYear = (returns, currentYear) => {
  for (const currentReturn of returns) {
    if (currentReturn.year === String(currentYear - 1)) {
      return true;
    }
  }

  return false;
};

const isRecentlyExpired = (expiryDate) => {
  const currentDate = new Date();
  // An expiry date is recently expired if it is less than two months ago.
  return expiryDate < currentDate && expiryDate.setMonth(expiryDate.getMonth() + 2) > currentDate;
};

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
  // WE ARE TEMPORARILY ISSUING WITHOUT AN EXPIRY
  // REVERT by uncommenting the next line
  // expiryDate: calculateExpiryDate(),
  // AND removing the next line
  expiryDate: new Date() > new Date('2024/11/14') ? null : calculateExpiryDate(),
  uuid: body.uuid
});

/**
 * Clean an incoming request body to make it more compatible with the database and its validation rules.
 *
 * @param {any} body The incoming request's body.
 * @returns {any} CleanedBody a json object that's just got our cleaned up fields on it.
 */
const cleanNoteInput = (regId, body) => ({
  Note: body.note.trim(),
  createdBy: body.createdBy,
  RegistrationId: regId
});

/**
 * Clean an incoming PATCH request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} body the incoming request's body
 * @returns {any} cleanedBody a json object that's just got our cleaned up fields on it
 */
const cleanPatchInput = (body) => {
  const cleanedBody = {};

  // Check for the existence of each field and if found clean it if required and add to the cleanedBody object.
  if (Object.prototype.hasOwnProperty.call(body, 'convictions')) {
    cleanedBody.convictions = body.convictions;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'usingGL01')) {
    cleanedBody.usingGL01 = body.usingGL01;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'usingGL02')) {
    cleanedBody.usingGL02 = body.usingGL02;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'meatBaits')) {
    cleanedBody.meatBaits = body.meatBaits;
  }

  if (Object.prototype.hasOwnProperty.call(body, 'fullName')) {
    cleanedBody.fullName = body.fullName.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'addressLine1')) {
    cleanedBody.addressLine1 = body.addressLine1.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'addressLine2')) {
    cleanedBody.addressLine2 = body.addressLine2.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'addressTown')) {
    cleanedBody.addressTown = body.addressTown.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'addressCounty')) {
    cleanedBody.addressCounty = body.addressCounty.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'addressPostcode')) {
    cleanedBody.addressPostcode = utils.postalAddress.formatPostcodeForPrinting(body.addressPostcode);
    if (!utils.postalAddress.isaRealUkPostcode(cleanedBody.addressPostcode)) {
      throw new Error('Invalid postcode.');
    }
  }

  if (Object.prototype.hasOwnProperty.call(body, 'phoneNumber')) {
    cleanedBody.phoneNumber = body.phoneNumber.trim();
  }

  if (Object.prototype.hasOwnProperty.call(body, 'emailAddress')) {
    cleanedBody.emailAddress = utils.recipients.validateAndFormatEmailAddress(body.emailAddress);
  }

  return cleanedBody;
};

/**
 * Clean the incoming POST request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} body The incoming request's body.
 * @returns {any} A json object that's just got our cleaned up fields on it.
 */
const cleanReturnInput = (id, body) => ({
  // The booleans are just copied across.
  nonTargetSpeciesToReport: body.nonTargetSpeciesToReport,
  noMeatBaitsUsed: body.noMeatBaitsUsed,

  // The id passed in is set as the registration id.
  RegistrationId: id,
  createdByLicensingOfficer: body.createdByLicensingOfficer,

  // Copy across the year the return is for and the number of larsen mate / pod traps in which meat baits were used.
  year: body.year ? body.year : undefined,
  numberLarsenMate: body.numberLarsenMate ? body.numberLarsenMate : undefined,
  numberLarsenPod: body.numberLarsenPod ? body.numberLarsenPod : undefined,

  // We copy across the nonTargetSpeciesCaught, cleaning them as we go.
  nonTargetSpecies:
    body.nonTargetSpeciesCaught === undefined
      ? undefined
      : body.nonTargetSpeciesCaught.map((nonTargetSpecies) => ({
          // The number is just copied across.
          numberCaught: nonTargetSpecies.numberCaught,

          // The strings are trimmed then copied.
          gridReference:
            nonTargetSpecies.gridReference === undefined ? undefined : nonTargetSpecies.gridReference.trim(),
          speciesCaught:
            nonTargetSpecies.speciesCaught === undefined ? undefined : nonTargetSpecies.speciesCaught.trim(),
          trapType: nonTargetSpecies.trapType === undefined ? undefined : nonTargetSpecies.trapType.trim(),
          comment: nonTargetSpecies.comment === undefined ? undefined : nonTargetSpecies.comment.trim()
        }))
});

/**
 * Clean the incoming POST request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} body The incoming request's body.
 * @returns {any} A json object that's just got our cleaned up fields on it.
 */
const cleanPatchReturnInput = (id, body) => ({
  // The booleans are just copied across.
  nonTargetSpeciesToReport: body.nonTargetSpeciesToReport,
  noMeatBaitsUsed: body.noMeatBaitsUsed,

  // The id passed in is set as the registration id.
  RegistrationId: id,
  createdByLicensingOfficer: body.createdByLicensingOfficer,

  // Copy across the year the return is for and the number of larsen mate / pod traps in which meat baits were used.
  year: body.year ? body.year : undefined,
  numberLarsenMate: Number.isNaN(body.numberLarsenMate) ? undefined : body.numberLarsenMate,
  numberLarsenPod: Number.isNaN(body.numberLarsenPod) ? undefined : body.numberLarsenPod
});

/**
 * Clean the incoming request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} existingId the Registration that is being revoked
 * @param {any} body the incoming request's body
 * @returns {any} a json object that's just got our cleaned up fields on it
 */
const cleanRevokeInput = (existingId, body) => ({
  RegistrationId: existingId,
  // The strings are trimmed for leading and trailing whitespace and then
  // copied across if they're in the POST body or are set to undefined if
  // they're missing.
  reason: body.reason === undefined ? undefined : body.reason.trim(),
  createdBy: body.createdBy === undefined ? undefined : body.createdBy.trim(),
  isRevoked: body.isRevoked
});

/**
 * Build a JWT to allow a visitor to log in to the renewal flow.
 *
 * @param {string} jwtPrivateKey
 * @param {string} email
 * @returns {string} a signed JWT
 */
const buildRenewalToken = (jwtPrivateKey, email) =>
  jwt.sign({}, jwtPrivateKey, {subject: `${email}`, algorithm: 'ES256', expiresIn: '30m', noTimestamp: true});

/**
 * Send an email to the visitor that contains a link which allows them to log in
 * to the rest of the meat bait return system.
 *
 * @param {string} notifyApiKey API key for sending emails
 * @param {string} emailAddress where to send the log in email
 * @param {string} loginLink link to log in via
 * @param {string} fullname users full name to appear on email.
 */
const sendRenewalEmail = async (notifyApiKey, emailAddress, loginLink, fullname) => {
  if (notifyApiKey) {
    const notifyClient = new NotifyClient.NotifyClient(notifyApiKey);

    await notifyClient.sendEmail('173ce02f-b78f-44eb-ac72-2a58af3606a9', emailAddress, {
      personalisation: {
        loginLink,
        Name: fullname
      },
      emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
    });
  }
};

// #region Health Check

/**
 * Gets the health status message for the API.
 */
v2Router.get('/health', async (request, response) => {
  response.status(200).send({message: 'OK'});
});

// #endregion

// #region Registrations - Listing

/**
 * READs all the registrations in the application.
 */
v2Router.get('/registrations', async (request, response) => {
  try {
    const registrations = await Registration.findAll();

    if (registrations === undefined || registrations === null) {
      return response.status(404).send({message: `No registrations found.`});
    }

    return response.status(200).send(registrations);
  } catch (error) {
    return response.status(500).send({error});
  }
});

// #endregion

// #region Registrations - Single Entity

/**
 * CREATEs a single registration.
 */
v2Router.post('/registrations', async (request, response) => {
  // Work out the base URL for returning later in the location header.
  const baseUrl = new URL(
    `${request.protocol}://${request.hostname}:${config.port}${request.originalUrl}${
      request.originalUrl.endsWith('/') ? '' : '/'
    }`
  );

  try {
    // Clean up the user's input before we store it in the database.
    const cleanObject = cleanInput(request.body);

    // Try to create the new registration entry.
    const newRegistration = await Registration.create(cleanObject);

    let newId;

    // Grab the new registration ID.
    if (newRegistration) {
      newId = newRegistration.id;
    }

    // On success return 201 with the location of the new entry in the response header.
    return response.status(201).location(new URL(newId, baseUrl)).send(newRegistration);
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * CREATEs a single note in a single registration.
 */
v2Router.post('/registrations/:id/note', async (request, response) => {
  // Try to parse the incoming ID to make sure it's really a number.
  const existingId = Number(request.params.id);
  if (Number.isNaN(existingId)) {
    return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
  }

  // Check if there's a registration allocated at the specified ID.
  const existingReg = await Registration.findOne(existingId);
  if (existingReg === undefined || existingReg === null) {
    return response.status(404).send({message: `Registration ${existingId} not allocated.`});
  }

  const baseUrl = new URL(
    `${request.protocol}://${request.hostname}:${config.port}${request.originalUrl}${
      request.originalUrl.endsWith('/') ? '' : '/'
    }`
  );

  // Clean up the user's input before we store it in the database.
  const cleanObject = cleanNoteInput(existingId, request.body);

  try {
    const newId = await Note.create(cleanObject);
    if (newId === undefined) {
      return response.status(500).send({message: 'Note could not be created.'});
    }

    return response.status(201).location(new URL(newId, baseUrl)).send();
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * READs a single registration.
 */
v2Router.get('/registrations/:id', async (request, response) => {
  const {idType} = request.query;
  let isEmail = false;

  if (idType && idType === 'email') {
    isEmail = true;
  }

  try {
    const existingId = request.params.id;
    let registrationFunction;

    if (isEmail) {
      registrationFunction = Registration.findAllByEmail;
    } else {
      if (Number.isNaN(existingId)) {
        return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
      }

      registrationFunction = Registration.findOne;
    }

    const registration = await registrationFunction(existingId);

    if (registration === undefined || registration === null) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    if (Array.isArray(registration)) {
      for (const reg of registration) {
        reg.Returns.sort((a, b) => a.id - b.id);
      }
    } else {
      registration.Returns.sort((a, b) => a.id - b.id);
    }

    return response.status(200).send(registration);
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * UPDATEs a single registration.
 */
v2Router.put('/registrations/:id', async (request, response) =>
  response.status(501).send({message: 'Not implemented.'})
);

/**
 * UPDATEs part of a single registration.
 */
v2Router.patch('/registrations/:id', async (request, response) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(request.params.id);
    if (Number.isNaN(existingId)) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    // Check if there's a registration allocated at the specified ID.
    const existingReg = await Registration.findOne(existingId);
    if (existingReg === undefined || existingReg === null) {
      return response.status(404).send({message: `Registration ${existingId} not allocated.`});
    }

    // Clean up the user's input before we store it in the database.
    let cleanObject;
    try {
      cleanObject = cleanPatchInput(request.body);
    } catch (error) {
      return response.status(400).send({message: `Could not update registration ${existingId}. ${error.message}`});
    }

    // Update the registration in the database with our client's values.
    const updatedReg = await Registration.update(existingId, cleanObject);

    // If they're not successful, send a 500 error.
    if (updatedReg === undefined) {
      return response.status(500).send({message: `Could not update registration ${existingId}.`});
    }

    // If they are, send back the updated fields.
    return response.status(200).send(updatedReg);
  } catch (error) {
    // When anything else goes wrong send the error to the client.
    return response.status(500).send({error});
  }
});

/**
 * DELETEs a single registration.
 */
v2Router.delete('/registrations/:id', async (request, response) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(request.params.id);
    if (Number.isNaN(existingId)) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    // Clean up the user's input before we store it in the database.
    const cleanObject = cleanRevokeInput(existingId, request.body);

    const deleteRegistration = await Registration.delete(existingId, cleanObject);

    if (deleteRegistration === false) {
      return response.status(500).send({message: `Could not delete Registration ${existingId}.`});
    }

    // If we are able to delete the registration return 200 OK to the client.
    return response.status(200).send();
  } catch (error) {
    // If anything goes wrong (such as a validation error), tell the client.
    return response.status(500).send({error});
  }
});

// #endregion

// #region Returns - Listing

/**
 * READs all the returns in the application.
 */
v2Router.get('/returns', async (request, response) => {
  try {
    const returns = await Return.findAll();

    if (returns === undefined || returns === null) {
      return response.status(404).send({message: `No returns found.`});
    }

    return response.status(200).send(returns);
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * READs all the returns in a single registration.
 */
v2Router.get('/registrations/:id/returns', async (request, response) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(request.params.id);
    if (Number.isNaN(existingId)) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    // Check if there's a registration allocated at the specified ID.
    const existingReg = await Registration.findOne(existingId);
    if (existingReg === undefined || existingReg === null) {
      return response.status(404).send({message: `Registration ${existingId} not allocated.`});
    }

    const returns = await Return.findRegReturns(existingId);

    if (returns === undefined || returns === null) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    return response.status(200).send(returns);
  } catch (error) {
    return response.status(500).send({error});
  }
});

// #endregion

// #region Returns - Single Entity

/**
 * CREATEs a single return in a single registration.
 */
v2Router.post('/registrations/:id/returns', async (request, response) => {
  // Try to parse the incoming ID to make sure it's really a number.
  const existingId = Number(request.params.id);
  if (Number.isNaN(existingId)) {
    return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
  }

  // Check if there's a registration allocated at the specified ID.
  const existingReg = await Registration.findOne(existingId);
  if (existingReg === undefined || existingReg === null) {
    return response.status(404).send({message: `Registration ${existingId} not allocated.`});
  }

  const baseUrl = new URL(
    `${request.protocol}://${request.hostname}:${config.port}${request.originalUrl}${
      request.originalUrl.endsWith('/') ? '' : '/'
    }`
  );

  // Clean up the user's input before we store it in the database.
  const cleanObject = cleanReturnInput(existingId, request.body);

  try {
    const newId = await Return.create(cleanObject);
    if (newId === undefined) {
      return response.status(500).send({message: 'Return could not be created.'});
    }

    return response.status(201).location(new URL(newId, baseUrl)).send();
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * READs a single return in a single registration.
 */
v2Router.get('/registrations/:id/returns/:returnId', async (request, response) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(request.params.id);
    if (Number.isNaN(existingId)) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    // Check if there's a registration allocated at the specified ID.
    const existingReg = await Registration.findOne(existingId);
    if (existingReg === undefined || existingReg === null) {
      return response.status(404).send({message: `Registration ${existingId} not allocated.`});
    }

    // Try to parse the incoming ID to make sure it's really a number.
    const existingReturnId = Number(request.params.returnId);
    if (Number.isNaN(existingReturnId)) {
      return response.status(404).send({message: `Return ${request.params.returnId} not valid.`});
    }

    // Check if there's a return allocated at the specified ID.
    const existingReturn = await Return.findOne(existingReturnId);

    if (existingReturn === undefined || existingReturn === null) {
      return response.status(404).send({message: `Return ${existingReturnId} not allocated.`});
    }

    // Check if the return is allocated to the specified registration.
    if (existingReturn.RegistrationId !== existingId) {
      return response
        .status(404)
        .send({message: `Return ${existingReturnId} not found against Registration ${existingId}.`});
    }

    // If they are, send back the finalised return.
    return response.status(200).send(existingReturn);
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * UPDATEs part of a meat bait return.
 */
v2Router.patch('/registrations/:id/returns/:returnId', async (request, response) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(request.params.id);
    if (Number.isNaN(existingId)) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    // Check if there's a return allocated at the specified ID.
    const existingReg = await Registration.findOne(existingId);
    // Did we get an application?
    if (existingReg === undefined || existingReg === null) {
      return response.status(404).send({message: `Registration ${existingId} not allocated.`});
    }

    // Try to parse the incoming ID to make sure it's really a number.
    const existingReturnId = Number(request.params.returnId);
    if (Number.isNaN(existingReturnId)) {
      return response.status(404).send({message: `Return ${request.params.returnId} not valid.`});
    }

    // Check if there's a return allocated at the specified ID.
    const existingReturn = await Return.findOne(existingReturnId);
    if (existingReturn === undefined || existingReturn === null) {
      return response.status(404).send({message: `Return ${existingReturnId} not allocated.`});
    }

    // Clean up the user's input before we store it in the database.
    let cleanObject;
    try {
      cleanObject = cleanPatchReturnInput(existingId, request.body);
    } catch (error) {
      return response.status(400).send({message: `Could not update registration ${existingId}. ${error.message}`});
    }

    // Update the return in the database with our client's values.
    const updatedReturn = await Return.update(existingReturnId, cleanObject);

    // If they're not successful, send a 500 error.
    if (updatedReturn === undefined) {
      return response.status(500).send({message: `Could not update return ${existingReturnId}.`});
    }

    // If they are, send back the updated fields.
    return response.status(200).send(updatedReturn);
  } catch (error) {
    // When anything else goes wrong send the error to the client.
    return response.status(500).send({error});
  }
});

/**
 * Send out a reminder email on valid licences that returns are due.
 */
v2Router.post('/valid-licence-returns-due-reminder', async (request, response) => {
  // We need to know the date.
  const currentDate = new Date();

  try {
    const registrations = await ScheduledController.findAll();

    // Filter the registrations so only those that are valid and are using meat baits are left.
    const filteredRegistrations = registrations.filter(
      (registration) => new Date(registration.expiryDate) > currentDate && registration.meatBaits === true
    );

    // Try to send out reminder emails.
    const emailsSent = await ScheduledController.sendReturnReminder(filteredRegistrations);

    return response
      .status(200)
      .send({message: `Sent ${emailsSent} valid licence with meat baits return reminder emails.`});
  } catch (error) {
    jsonConsoleLogger.error(unErrorJson(error));
    return response.status(500).send({error});
  }
});

/**
 * Send out a reminder email on valid licences with no returns submitted on the previous year
 * that returns are due.
 */
v2Router.post('/valid-licence-no-returns-previous-year-reminder', async (request, response) => {
  // We need to know the date and year.
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  try {
    const registrations = await ScheduledController.findAll();

    // Filter the registrations so only those that are valid, using meat baits and
    // have no return against the previous year are left.
    const filteredRegistrations = registrations.filter(
      (registration) =>
        new Date(registration.expiryDate) > currentDate &&
        registration.meatBaits === true &&
        !hasReturnForPreviousYear(registration.Returns, currentYear)
    );

    // Try to send out reminder emails.
    const emailsSent = await ScheduledController.sendPreviousYearReturnReminder(filteredRegistrations);

    return response
      .status(200)
      .send({message: `Sent ${emailsSent} valid licence with meat baits but no previous year return reminder emails.`});
  } catch (error) {
    jsonConsoleLogger.error(unErrorJson(error));
    return response.status(500).send({error});
  }
});

/**
 * Send out a reminder email on valid licences with no returns submitted
 * that returns are due.
 */
v2Router.post('/valid-licence-no-returns-reminder', async (request, response) => {
  // We need to know the date and year.
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  try {
    const registrations = await ScheduledController.findAll();

    // Filter the registrations so only those that are valid, using meat baits,
    // did not start this year, and have no returns against them are left.
    const filteredRegistrations = registrations.filter(
      (registration) =>
        new Date(registration.expiryDate) > currentDate &&
        !(
          new Date(registration.createdAt).getFullYear() === currentYear &&
          new Date(registration.createdAt).getMonth() < 3
        ) &&
        registration.meatBaits === true &&
        registration.Returns.length === 0
    );

    // Try to send out reminder emails.
    const emailsSent = await ScheduledController.sendNoReturnReminder(filteredRegistrations);

    return response
      .status(200)
      .send({message: `Sent ${emailsSent} valid licence with meat baits but no returns reminder emails.`});
  } catch (error) {
    jsonConsoleLogger.error(unErrorJson(error));
    return response.status(500).send({error});
  }
});

/**
 * Send out a reminder email on recently expired licences with no returns submitted
 * that returns are due.
 */
v2Router.post('/expired-licence-no-returns-reminder', async (request, response) => {
  try {
    const registrations = await ScheduledController.findAll();

    // Filter the registrations so only those that are recently expired, using meat baits,
    // and have no returns against them are left.
    const filteredRegistrations = registrations.filter(
      (registration) =>
        isRecentlyExpired(new Date(registration.expiryDate)) &&
        registration.meatBaits === true &&
        registration.Returns.length === 0
    );

    // Try to send out reminder emails.
    const emailsSent = await ScheduledController.sendExpiredNoReturnReminder(filteredRegistrations);

    return response
      .status(200)
      .send({message: `Sent ${emailsSent} recently expired licence with meat baits but no returns reminder emails.`});
  } catch (error) {
    jsonConsoleLogger.error(unErrorJson(error));
    return response.status(500).send({error});
  }
});

/**
 * Send out a reminder email on recently expired licences with no returns submitted
 * that returns are due.
 */
v2Router.post('/expired-licences-two-week-reminder', async (request, response) => {
  try {
    // Registrations due to expire in two weeks time.
    const registrations = await ScheduledController.findAllDueToExpireInTwoWeeks();

    // Try to send out reminder emails.
    const emailsSent = await ScheduledController.sendTwoWeekExpiryReminder(registrations);

    return response.status(200).send(`Sent renewal reminders for ${emailsSent} recently expired licences.`);
  } catch (error) {
    jsonConsoleLogger.error(unErrorJson(error));
    return response.status(500).send({error});
  }
});

/**
 * UPDATEs a single return in a single registration.
 */
v2Router.put('/registrations/:id/returns/:returnId', async (request, response) =>
  response.status(501).send({message: 'Not implemented.'})
);

/**
 * DELETEs a single return in a single registration.
 */
v2Router.delete('/registrations/:id/returns/:returnId', async (request, response) =>
  response.status(501).send({message: 'Not implemented.'})
);

// #endregion

// #region Returns - Public Login Process

/**
 * Gets the application's public key to allow other applications to
 * verify our signed tokens.
 */
v2Router.get('/public-key', async (request, response) => response.status(501).send({message: 'Not implemented.'}));

/**
 * Send a login link to a visitor.
 */
v2Router.get('/registrations/:id/login', async (request, response) =>
  response.status(501).send({message: 'Not implemented.'})
);

/**
 * Send out a renewal email to user if email has been found in database.
 */
v2Router.post('/registrations/renewal-email-check', async (request, response) => {
  // Check that the visitor's given us an email address.
  const {email} = request.body.params;
  const emailInvalid = email === undefined;

  let emailExists;
  try {
    emailExists = await Registration.findAllEmails(email);
  } catch (error) {
    console.error({error});
  }

  // Check if there's a registration allocated at the specified email address.
  const emailNotFound = emailExists === undefined || emailExists === null || emailExists.length === 0;

  // Check that the visitor's given us a base url.
  const {redirectBaseUrl} = request.body.params;
  const urlInvalid = redirectBaseUrl === undefined || redirectBaseUrl === null;

  // As long as we're happy that the visitor's provided use with valid
  // information, build them a token for logging in with.
  let token;
  if (!emailNotFound && !emailInvalid) {
    token = buildRenewalToken(jwk.getPrivateKey(), email);
  }

  // If the visitor has given us enough information, build them a link that will
  // allow them to click-to-log-in.
  let loginLink;
  if (!urlInvalid && token !== undefined) {
    loginLink = `${redirectBaseUrl}${token}`;
  }

  // As long as we've managed to build a login link, send the visitor an email
  // with that link included.
  if (loginLink !== undefined) {
    const name = emailExists[0].fullName;
    await sendRenewalEmail(config.notifyApiKey, email, loginLink, name);
  }

  // If we're in production, no matter what, tell the API consumer that everything went well.
  if (process.env.NODE_ENV === 'production') {
    return response.status(200).send();
  }

  // If we're in development mode, send back a debug message, with the link for
  // the developer, to avoid sending unnecessary emails.
  return response.status(200).send({
    emailExists,
    emailNotFound,
    emailInvalid,
    urlInvalid,
    token,
    loginLink
  });
});

v2Router.post('/registrations/:id/renew', async (request, response) => {
  const {status, id} = await RenewalController.create(request);

  return response.status(status).send({id});
});

// #endregion

export {v2Router as default};
