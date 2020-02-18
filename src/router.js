import express from 'express';
import config from './config/app.js';

const router = express.Router();

import Registration from './controllers/registration.js';

// Allow an API consumer to allocate a new registration number.
router.post('/registrations', async (req, res) => {
  const baseUrl = new URL(
    `${req.protocol}://${req.hostname}:${config.port}${req.originalUrl}${req.originalUrl.endsWith('/') ? '' : '/'}`
  );

  try {
    const newId = await Registration.create();
    res
      .status(201)
      .location(new URL(newId, baseUrl))
      .send();
  } catch (error) {
    res.status(500).send({error});
  }
});

// Allow an API consumer to save a registration against an allocated but un-assigned registration number.
router.put('/registrations/:id', async (req, res) => {
  try {
    // Try to parse the incoming ID to make sure it's really a number.
    const existingId = Number(req.params.id);
    if (isNaN(existingId)) {
      res.status(404).send({message: `Registration ${req.params.id} not valid.`});
      return;
    }

    // Check if there's a registration allocated at the specified ID.
    const existingReg = await Registration.findOne(existingId);
    if (existingReg === undefined || existingReg === null) {
      res.status(404).send({message: `Registration ${existingId} not allocated.`});
      return;
    }

    // Check the specified registration hasn't been assigned to anyone yet.
    if (existingReg.fullName !== undefined && existingReg.fullName !== null) {
      res.status(409).send({message: `Registration ${existingId} already assigned.`});
      return;
    }

    // Update the registration in the database with our client's values.
    const success = await Registration.update(existingId, req.body);
    if (success) {
      // If they're successful, tell them!
      res.status(204).send();
    } else {
      // If not, send a 500 error.
      res.status(500).send({message: `Could not update registration ${existingId}.`});
    }
  } catch (error) {
    // If anything goes wrong (such as a validation error), tell the client.
    res.status(500).send({error});
  }
});

export {router as default};
