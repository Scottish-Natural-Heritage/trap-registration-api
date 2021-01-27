import express from 'express';
import config from './config/app.js';

import jose from 'node-jose';

const router = express.Router();

import Registration from './controllers/registration.js';

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

export {router as default};
