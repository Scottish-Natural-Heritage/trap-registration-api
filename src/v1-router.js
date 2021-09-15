import express from 'express';

import jwt from 'jsonwebtoken';

import utils from 'naturescot-utils';
import NotifyClient from 'notifications-node-client';

import config from './config/app.js';
import jwk from './config/jwk.js';

import Registration from './controllers/v1/registration.js';
import Return from './controllers/v1/return.js';

const v1router = express.Router();

// `/health` is a simple health-check end-point to test whether the service is up.
v1router.get('/health', async (request, response) => {
  response.status(200).send({message: 'OK'});
});

v1router.get('/registrations', async (request, response) => {
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
// Allow an API consumer to allocate a new registration number.
v1router.post('/registrations', async (request, response) => {
  const baseUrl = new URL(
    `${request.protocol}://${request.hostname}:${config.port}${request.originalUrl}${
      request.originalUrl.endsWith('/') ? '' : '/'
    }`
  );

  try {
    const newId = await Registration.create();
    return response.status(201).location(new URL(newId, baseUrl)).send();
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * Calculates the expiry date by taking the current date and adding five years
 * and subtracting a single day.
 * @returns {Date} the calculated expiry date
 */
const calculateExpiryDate = () => {
  // Get the current date.
  const expiryDate = new Date();
  // Add 5 years.
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);
  // Subtract 1 day and return as expiry date.
  return expiryDate.setDate(expiryDate.getDate() - 1);
}

/**
 * Clean the incoming POST request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} body the incoming request's body
 * @returns {any} a json object that's just got our cleaned up fields on it
 */
const cleanInput = (body) => {
  return {
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
    expiryDate: calculateExpiryDate()
  };
};

v1router.get('/registrations/:id', async (request, response) => {
  try {
    const existingId = Number(request.params.id);
    if (Number.isNaN(existingId)) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    const registration = await Registration.findOne(existingId);

    if (registration === undefined || registration === null) {
      return response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    }

    return response.status(200).send(registration);
  } catch (error) {
    return response.status(500).send({error});
  }
});

// Allow an API consumer to save a registration against an allocated but un-assigned registration number.
v1router.put('/registrations/:id', async (request, response) => {
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

    // Check the specified registration hasn't been assigned to anyone yet.
    if (existingReg.fullName !== undefined && existingReg.fullName !== null) {
      return response.status(409).send({message: `Registration ${existingId} already assigned.`});
    }

    // Clean up the user's input before we store it in the database.
    const cleanObject = cleanInput(request.body);

    // Update the registration in the database with our client's values.
    const updatedReg = await Registration.update(existingId, cleanObject);

    // If they're not successful, send a 500 error.
    if (updatedReg === undefined) {
      return response.status(500).send({message: `Could not update registration ${existingId}.`});
    }

    // If they are, send back the finalised registration.
    return response.status(200).send(updatedReg);
  } catch (error) {
    // If anything goes wrong (such as a validation error), tell the client.
    return response.status(500).send({error});
  }
});

/**
 * Clean the incoming request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} existingId the Registration that is being revoked
 * @param {any} body the incoming request's body
 * @returns {any} a json object that's just got our cleaned up fields on it
 */
const cleanRevokeInput = (existingId, body) => {
  return {
    RegistrationId: existingId,
    // The strings are trimmed for leading and trailing whitespace and then
    // copied across if they're in the POST body or are set to undefined if
    // they're missing.
    reason: body.reason === undefined ? undefined : body.reason.trim(),
    createdBy: body.createdBy === undefined ? undefined : body.createdBy.trim(),
    isRevoked: body.isRevoked
  };
};

// Allow an API consumer to delete a registration.
v1router.delete('/registrations/:id', async (request, response) => {
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

    // If they are, send back true.
    return response.status(200).send();
  } catch (error) {
    // If anything goes wrong (such as a validation error), tell the client.
    return response.status(500).send({error});
  }
});

v1router.get('/returns', async (request, response) => {
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

v1router.get('/registrations/:id/return', async (request, response) => {
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

v1router.get('/registrations/:id/return/:returnId', async (request, response) => {
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

// Allow an API consumer to retrieve the public half of our ECDSA key to
// validate our signed JWTs.
v1router.get('/public-key', async (request, response) => {
  return response.status(200).send(jwk.getPublicKey());
});

/**
 * Build a JWT to allow a visitor to log in to the supply a return flow.
 *
 * @param {string} jwtPrivateKey
 * @param {string} id
 * @returns {string} a signed JWT
 */
const buildToken = (jwtPrivateKey, id) => {
  return jwt.sign({}, jwtPrivateKey, {subject: `${id}`, algorithm: 'ES256', expiresIn: '30m', noTimestamp: true});
};

/**
 * Send an email to the visitor that contains a link which allows them to log in
 * to the rest of the meat bait return system.
 *
 * @param {string} notifyApiKey API key for sending emails
 * @param {string} emailAddress where to send the log in email
 * @param {string} loginLink link to log in via
 * @param {string} regNo trap registration number for notify's records
 */
const sendLoginEmail = async (notifyApiKey, emailAddress, loginLink, regNo) => {
  if (notifyApiKey) {
    const notifyClient = new NotifyClient.NotifyClient(notifyApiKey);

    await notifyClient.sendEmail('a5901745-e01c-4e42-a726-ece91b63e593', emailAddress, {
      personalisation: {
        loginLink
      },
      reference: `${regNo}`,
      emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
    });
  }
};

/**
 * Test if two postcodes match.
 *
 * A match is when the alphanumeric characters in the supplied strings equal
 * each other once all other characters have been removed and everything's been
 * transformed to lower-case. It's extreme, but ' !"£IV3$%^8NW&*( ' should match
 * 'iv3 8nw'.
 *
 * @param {string} postcode1 a postcode to check
 * @param {string} postcode2 the other postcode to check
 * @returns {boolean} true if they kinda match, false otherwise
 */
const postcodesMatch = (postcode1, postcode2) => {
  // Regex that matches any and all non alpha-num characters.
  const notAlphaNumber = /[^a-z\d]/gi;

  // Clean our two strings to the 'same' representation.
  const cleanPostcode1 = postcode1.replace(notAlphaNumber, '').toLocaleLowerCase();
  const cleanPostcode2 = postcode2.replace(notAlphaNumber, '').toLocaleLowerCase();

  // Check if they match, now that they're clean.
  return cleanPostcode1 === cleanPostcode2;
};

// Allow the API consumer to provide enough personal information to allow us to
// build and send a login link for the specified visitor.
v1router.get('/registrations/:id/login', async (request, response) => {
  // Try to parse the incoming ID to make sure it's really a number.
  const existingId = Number(request.params.id);
  const idInvalid = Number.isNaN(existingId);

  // Check if there's a registration allocated at the specified ID.
  const existingReg = await Registration.findOne(existingId);
  const idNotFound = existingReg === undefined || existingReg === null;

  // Check that the visitor's given us a postcode.
  const {postcode} = request.query;
  const postcodeInvalid = postcode === undefined;

  // Check that the visitor's supplied postcode matches their stored one.
  const postcodeIncorrect =
    existingReg !== undefined && existingReg !== null && !postcodesMatch(existingReg.addressPostcode, postcode);

  // Check that the visitor's given us a base url.
  const {redirectBaseUrl} = request.query;
  const urlInvalid = redirectBaseUrl === undefined || redirectBaseUrl === null;

  // As long as we're happy that the visitor's provided use with valid
  // information, build them a token for logging in with.
  let token;
  if (!idInvalid && !idNotFound && !postcodeInvalid && !postcodeIncorrect) {
    token = buildToken(jwk.getPrivateKey(), existingId);
  }

  // If the visitor has give us enough information, build them a link that will
  // allow them to click-to-log-in.
  let loginLink;
  if (!urlInvalid && token !== undefined) {
    loginLink = `${redirectBaseUrl}${token}`;
  }

  // As long as we've managed to build a login link, send the visitor an email
  // with that link included.
  if (loginLink !== undefined) {
    await sendLoginEmail(config.notifyApiKey, existingReg.emailAddress, loginLink, existingId);
  }

  // If we're in production, no matter what, tell the API consumer that everything went well.
  if (process.env.NODE_ENV === 'production') {
    return response.status(200).send();
  }

  // If we're in development mode, send back a debug message, with the link for
  // the developer, to avoid sending unnecessary emails.
  return response.status(200).send({
    idInvalid,
    idNotFound,
    postcodeInvalid,
    postcodeIncorrect,
    urlInvalid,
    token,
    loginLink
  });
});

/**
 * Clean the incoming POST request body to make it more compatible with the
 * database and its validation rules.
 *
 * @param {any} body The incoming request's body.
 * @returns {any} A json object that's just got our cleaned up fields on it.
 */
const cleanReturnInput = (id, body) => {
  return {
    // The booleans are just copied across.
    nonTargetSpeciesToReport: body.nonTargetSpeciesToReport,
    // The id passed in is set as the registration id.
    RegistrationId: id,
    createdByLicensingOfficer: body.createdByLicensingOfficer,

    // We copy across the nonTargetSpeciesCaught, cleaning them as we go.
    nonTargetSpecies:
      body.nonTargetSpeciesCaught === undefined
        ? undefined
        : body.nonTargetSpeciesCaught.map((nonTargetSpecies) => {
            return {
              // The number is just copied across.
              numberCaught: nonTargetSpecies.numberCaught,

              // The strings are trimmed then copied.
              gridReference:
                nonTargetSpecies.gridReference === undefined ? undefined : nonTargetSpecies.gridReference.trim(),
              speciesCaught:
                nonTargetSpecies.speciesCaught === undefined ? undefined : nonTargetSpecies.speciesCaught.trim(),
              trapType: nonTargetSpecies.trapType === undefined ? undefined : nonTargetSpecies.trapType.trim(),
              comment: nonTargetSpecies.comment === undefined ? undefined : nonTargetSpecies.comment.trim()
            };
          })
  };
};

// Allow the API consumer to submit a return against a registration.
v1router.post('/registrations/:id/return', async (request, response) => {
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

  try {
    const newId = await Return.create();
    return response.status(201).location(new URL(newId, baseUrl)).send();
  } catch (error) {
    return response.status(500).send({error});
  }
});

/**
 * Send email to the trap owner to let them know their return was successful.
 *
 * @param {string} apiKey API key for sending emails
 * @param {string} email where to send the return confirmation email
 * @param {string} regNo trap registration number for notify's records
 */
const sendSuccessReturnEmail = async (apiKey, email, regNo) => {
  if (apiKey) {
    const notifyClient = new NotifyClient.NotifyClient(apiKey);

    await notifyClient.sendEmail('dd023ad0-7168-44b6-86e2-f9795d3f78c5', email, {
      personalisation: {
        regNo: `${regNo}`
      },
      reference: `${regNo}`,
      emailReplyToId: '4a9b34d1-ab1f-4806-83df-3e29afef4165'
    });
  }
};

// Allow an API consumer to save a return against an allocated but un-assigned return number.
v1router.put('/registrations/:id/return/:returnId', async (request, response) => {
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
    const cleanObject = cleanReturnInput(existingId, request.body);

    // Update the registration in the database with our client's values.
    const updatedReturn = await Return.update(existingReturnId, cleanObject);

    // If they're not successful, send a 500 error.
    if (updatedReturn === undefined) {
      return response.status(500).send({message: `Could not update return ${existingReturnId}.`});
    }

    // Send the trap holder their confirmation email.
    await sendSuccessReturnEmail(config.notifyApiKey, existingReg.emailAddress, existingId);

    // If they are, send back the finalised return.
    return response.status(200).send(updatedReturn);
  } catch (error) {
    // If anything goes wrong (such as a validation error), tell the client.
    return response.status(500).send({error});
  }
});

export {v1router as default};
