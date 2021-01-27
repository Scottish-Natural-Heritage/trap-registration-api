const assert = require('assert');
const fs = require('fs');

// Declare up front what env vars we need to continue and ensure they're set.
assert(process.env.TR_NOTIFY_API_KEY !== undefined, 'An API Key for GOV.UK Notify (TR_NOTIFY_API_KEY) is required.');

// Grab our config from the env vars, or set some defaults if they're missing.
module.exports = Object.freeze({
  port: process.env.TR_API_PORT || 3001,
  databaseHost: process.env.LICENSING_DB_HOST || 'override_this_value',
  licensingPassword: process.env.LICENSING_DB_PASS || 'override_this_value',
  trapsPassword: process.env.TR_DB_PASS || 'override_this_value',
  pathPrefix: process.env.TR_API_PATH_PREFIX ? `/${process.env.TR_API_PATH_PREFIX}` : '/trap-registration-api',
  notifyApiKey: process.env.TR_NOTIFY_API_KEY,
  jwtPrivateKey: fs.readFileSync('./.secrets/jwt-key'),
  jwtPublicKey: fs.readFileSync('./.secrets/jwt-key.pub')
});
