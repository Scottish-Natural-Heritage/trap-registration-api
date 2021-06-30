import express from 'express';

const v2Router = express.Router();

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
  return response.status(501).send({message: 'Not implemented.'});
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
  return response.status(501).send({message: 'Not implemented.'});
});

/**
 * UPDATEs a single registration.
 */
v2Router.put('/registrations/:id', async (request, response) => {
  return response.status(501).send({message: 'Not implemented.'});
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
  return response.status(501).send({message: 'Not implemented.'});
});

/**
 * READs all the returns in a single registration.
 */
v2Router.get('/registrations/:id/returns', async (request, response) => {
  return response.status(501).send({message: 'Not implemented.'});
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
  return response.status(501).send({message: 'Not implemented.'});
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
