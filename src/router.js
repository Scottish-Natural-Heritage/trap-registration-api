import express from 'express';
import config from './config/app.js';

import jwt from 'jsonwebtoken';
import jose from 'node-jose';

import NotifyClient from 'notifications-node-client';

const router = express.Router();

import Registration from './controllers/registration.js';
import Return from './controllers/return.js';

// `/health` is a simple health-check end-point to test whether the service is up.
router.get('/health', async (request, response) => {
  response.status(200).send({message: 'OK'});
});

// Allow an API consumer to allocate a new registration number.
router.post('/registrations', async (request, response) => {
  const baseUrl = new URL(
    `${request.protocol}://${request.hostname}:${config.port}${request.originalUrl}${
      request.originalUrl.endsWith('/') ? '' : '/'
    }`
  );

  try {
    const newId = await Registration.create();
    response.status(201).location(new URL(newId, baseUrl)).send();
  } catch (error) {
    response.status(500).send({error});
  }
});

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
    emailAddress: body.emailAddress === undefined ? undefined : body.emailAddress.trim()
  };
};

// Allow an API consumer to save a registration against an allocated but un-assigned registration number.
router.put('/registrations/:id', async (request, response) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(request.params.id);
    if (isNaN(existingId)) {
      response.status(404).send({message: `Registration ${request.params.id} not valid.`});
      return;
    }

    // Check if there's a registration allocated at the specified ID.
    const existingReg = await Registration.findOne(existingId);
    if (existingReg === undefined || existingReg === null) {
      response.status(404).send({message: `Registration ${existingId} not allocated.`});
      return;
    }

    // Check the specified registration hasn't been assigned to anyone yet.
    if (existingReg.fullName !== undefined && existingReg.fullName !== null) {
      response.status(409).send({message: `Registration ${existingId} already assigned.`});
      return;
    }

    // Clean up the user's input before we store it in the database.
    const cleanObject = cleanInput(request.body);

    // Update the registration in the database with our client's values.
    const updatedReg = await Registration.update(existingId, cleanObject);

    // If they're not successful, send a 500 error.
    if (updatedReg === undefined) {
      response.status(500).send({message: `Could not update registration ${existingId}.`});
    }

    // If they are, send back the finalised registration.
    response.status(200).send(updatedReg);
  } catch (error) {
    // If anything goes wrong (such as a validation error), tell the client.
    response.status(500).send({error});
  }
});

// Allow an API consumer to retrieve the public half of our ECDSA key to
// validate our signed JWTs.
router.get('/public-key', async (request, response) => {
  const key = await jose.JWK.asKey(config.jwtPublicKey, 'pem');
  response.status(200).send(key.toJSON());
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
  const notifyClient = new NotifyClient.NotifyClient(notifyApiKey);

  await notifyClient.sendEmail('a5901745-e01c-4e42-a726-ece91b63e593', emailAddress, {
    personalisation: {
      loginLink
    },
    reference: `${regNo}`,
    emailReplyToId: '4b49467e-2a35-4713-9d92-809c55bf1cdd'
  });
};

// Allow the API consumer to provide enough personal information to allow us to
// build and send a login link for the specified visitor.
router.get('/registrations/:id/login', async (request, response) => {
  // Try to parse the incoming ID to make sure it's really a number.
  const existingId = Number(request.params.id);
  const idInvalid = isNaN(existingId);

  // Check if there's a registration allocated at the specified ID.
  const existingReg = await Registration.findOne(existingId);
  const idNotFound = existingReg === undefined || existingReg === null;

  // Check that the visitor's given us a postcode.
  const {postcode} = request.query;
  const postcodeInvalid = postcode === undefined;

  // Check that the visitor's supplied postcode matches their stored one.
  const postcodeIncorrect =
    existingReg !== undefined && existingReg !== null && existingReg.addressPostcode !== postcode;

  // Check that the visitor's given us a base url.
  const {redirectBaseUrl} = request.query;
  const urlInvalid = redirectBaseUrl === undefined || redirectBaseUrl === null;

  // As long as we're happy that the visitor's provided use with valid
  // information, build them a token for logging in with.
  let token;
  if (!idInvalid && !idNotFound && !postcodeInvalid && !postcodeIncorrect) {
    token = buildToken(config.jwtPrivateKey, existingId);
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
    response.status(200).send();
    return;
  }

  // If we're in development mode, send back a debug message, with the link for
  // the developer, to avoid sending unnecessary emails.
  response.status(200).send({
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
router.post('/registrations/:id/return', async (request, response) => {
  // Try to parse the incoming ID to make sure it's really a number.
  const existingId = Number(request.params.id);
  if (isNaN(existingId)) {
    response.status(404).send({message: `Registration ${request.params.id} not valid.`});
    return;
  }

  // Check if there's a registration allocated at the specified ID.
  const existingReg = await Registration.findOne(existingId);
  if (existingReg === undefined || existingReg === null) {
    response.status(404).send({message: `Registration ${existingId} not allocated.`});
    return;
  }

  const baseUrl = new URL(
    `${request.protocol}://${request.hostname}:${config.port}${request.originalUrl}${
      request.originalUrl.endsWith('/') ? '' : '/'
    }`
  );

  try {
    const newId = await Return.create();
    response.status(201).location(new URL(newId, baseUrl)).send();
  } catch (error) {
    response.status(500).send({error});
  }
});

// Allow an API consumer to save a return against an allocated but un-assigned return number.
router.put('/registrations/:id/return/:returnId', async (request, response) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(request.params.id);
    if (isNaN(existingId)) {
      response.status(404).send({message: `Registration ${request.params.id} not valid.`});
      return;
    }

    // Check if there's a registration allocated at the specified ID.
    const existingReg = await Registration.findOne(existingId);
    if (existingReg === undefined || existingReg === null) {
      response.status(404).send({message: `Registration ${existingId} not allocated.`});
      return;
    }

    const existingReturnId = Number(request.params.returnId);
    if (isNaN(existingReturnId)) {
      response.status(404).send({message: `Return ${request.params.returnId} not valid.`});
      return;
    }

    // Check if there's a return allocated at the specified ID.
    const existingReturn = await Return.findOne(existingReturnId);
    if (existingReturn === undefined || existingReturn === null) {
      response.status(404).send({message: `Return ${existingReturnId} not allocated.`});
      return;
    }

    // Clean up the user's input before we store it in the database.
    const cleanObject = cleanReturnInput(existingId, request.body);

    // Update the registration in the database with our client's values.
    const updatedReturn = await Return.update(existingReturnId, cleanObject);

    // If they're not successful, send a 500 error.
    if (updatedReturn === undefined) {
      response.status(500).send({message: `Could not update return ${existingReturnId}.`});
    }

    // If they are, send back the finalised return.
    response.status(200).send(updatedReturn);
  } catch (error) {
    // If anything goes wrong (such as a validation error), tell the client.
    response.status(500).send({error});
  }
});

export {router as default};
