// `express` _is_ used, it's just that it's only used in the jsdoc
// comments, so the linter doesn't see that.
// eslint-disable-next-line no-unused-vars
import express from 'express';
import onFinished from 'on-finished';

import jsonConsoleLogger from './json-console-logger.js';

/**
 * Grabs the 'resource' of a response's Location header if one exists.
 *
 * For example, if a new registration was created during a POST call,
 * the Location header would contain something like this:
 * `http://localhost:3001/trap-registration-api/v1/registrations/1234`
 * The 'resource' of that URL is `/registrations/1234`.
 *
 * @param {express.Response} response An API call's response, already
 * constructed, on the way back to the client.
 * @returns {string | undefined} The resource of the Location header if
 * the header exists, `undefined` otherwise.
 */
const redirectResource = (response) => {
  // Get the 'redirect' url if there is one.
  const redirectUrl = response.getHeader('Location');

  // If we don't have one, return undefined to remove the attribute
  // from the logged JSON object.
  if (!redirectUrl) {
    return undefined;
  }

  // http://.../v1/...
  //                ^~~~~~~~~~~ Capture this.
  const resourceRegex = /^.*\/v\d\/(.*)$/;
  const matches = redirectUrl.match(resourceRegex);

  // If we didn't capture the resource, something went wrong so
  // return undefined to remove the attribute from the logged JSON
  // object.
  if (matches.length !== 2) {
    return undefined;
  }

  // Return the resource to the calling code for inclusion in our
  // logged JSON object.
  return `/${matches[1]}`;
};

/**
 * A logging middleware that registers against the handler on the
 * 'finished' event of the response to an incoming request.
 *
 * It logs the C, U & D operations of the CRUD pattern in a structured
 * JSON object to the console.
 *
 * @param {express.Request} _request _Unused._
 * @param {express.Response} response The object whose finished event
 * we're waiting on to log the results of.
 * @param {express.NextFunction} next Callback from Express to indicate
 * that we're done and that it should move on to the next piece of
 * middleware.
 */
const apiLogger = (_request, response, next) => {
  // We want to know if the request was successful or not, so we need to
  // bind to the finished message from the http response.
  onFinished(response, (error, response) => {
    // Grab a shortcut to the original request object.
    const request = response.req;

    // Is a 'write' request is being made?
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method.toUpperCase())) {
      // If so, log enough information that we can recover a create,
      // update and delete log.
      jsonConsoleLogger.info({
        resource: request.url,
        action: request.method.toLowerCase(),
        success: response.statusCode < 400,
        status: response.statusCode,
        body: response.req.body,
        redirect: redirectResource(response)
      });
    }
  });

  // We don't want to take any action right now, so just call the `next`
  // middleware in the pipe.
  next();
};

export {apiLogger as default};
