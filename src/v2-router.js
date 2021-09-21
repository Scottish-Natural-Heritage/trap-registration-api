import express from 'express';
import utils from 'naturescot-utils';
import Registration from './controllers/v2/registration.js';
import Return from './controllers/v2/return.js';

const v2Router = express.Router();

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
  if (body.convictions) {
    cleanedBody.convictions = body.convictions;
  }

  if (body.usingGL01) {
    cleanedBody.usingGL01 = body.usingGL01;
  }

  if (body.usingGL02) {
    cleanedBody.usingGL02 = body.usingGL02;
  }

  if (body.meatBaits) {
    cleanedBody.meatBaits = body.meatBaits;
  }

  if (body.fullName) {
    cleanedBody.fullName = body.fullName.trim();
  }

  if (body.addressLine1) {
    cleanedBody.addressLine1 = body.addressLine1.trim();
  }

  if (body.addressLine2) {
    cleanedBody.addressLine2 = body.addressLine2.trim();
  }

  if (body.addressTown) {
    cleanedBody.addressTown = body.addressTown.trim();
  }

  if (body.addressCounty) {
    cleanedBody.addressCounty = body.addressCounty.trim();
  }

  if (body.addressPostcode) {
    cleanedBody.addressPostcode = utils.postalAddress.formatPostcodeForPrinting(body.addressPostcode);
    if (!utils.postalAddress.isaRealUkPostcode(cleanedBody.addressPostcode)) {
      throw new Error('Invalid postcode.');
    }
  }

  if (body.phoneNumber) {
    cleanedBody.phoneNumber = body.phoneNumber.trim();
  }

  if (body.emailAddress) {
    cleanedBody.emailAddress = utils.recipients.validateAndFormatEmailAddress(body.emailAddress);
  }

  return cleanedBody;
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
  return response.status(501).send({message: 'Not implemented.'});
});

/**
 * READs a single registration.
 */
v2Router.get('/registrations/:id', async (request, response) => {
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

/**
 * UPDATEs a single registration.
 */
v2Router.put('/registrations/:id', async (request, response) => {
  return response.status(501).send({message: 'Not implemented.'});
});

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
  return response.status(501).send({message: 'Not implemented.'});
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
  return response.status(501).send({message: 'Not implemented.'});
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
 * UPDATEs a single return in a single registration.
 */
v2Router.put('/registrations/:id/returns/:returnId', async (request, response) => {
  return response.status(501).send({message: 'Not implemented.'});
});

/**
 * DELETEs a single return in a single registration.
 */
v2Router.delete('/registrations/:id/returns/:returnId', async (request, response) => {
  return response.status(501).send({message: 'Not implemented.'});
});

// #endregion

// #region Returns - Public Login Process

/**
 * Gets the application's public key to allow other applications to
 * verify our signed tokens.
 */
v2Router.get('/public-key', async (request, response) => {
  return response.status(501).send({message: 'Not implemented.'});
});

/**
 * Send a login link to a visitor.
 */
v2Router.post('/registrations/:id/login', async (request, response) => {
  return response.status(501).send({message: 'Not implemented.'});
});

// #endregion

export {v2Router as default};
