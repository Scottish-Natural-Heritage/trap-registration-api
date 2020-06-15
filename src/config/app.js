const assert = require('assert');

// Declare up front what env vars we need to continue and ensure they're set.
assert(process.env.TR_API_PORT !== undefined, 'A port number (TR_API_PORT) is required.');
assert(
  process.env.LICENSING_DB_HOST !== undefined,
  'A hostname for the licensing database (LICENSING_DB_HOST) is required.'
);
assert(
  process.env.LICENSING_DB_PASS !== undefined,
  'A password for the licensing user (LICENSING_DB_PASS) is required.'
);
assert(process.env.TR_DB_PASS !== undefined, 'A password for the traps user (TR_DB_PASS) is required.');
assert(process.env.TR_NOTIFY_API_KEY !== undefined, 'An API Key for GOV.UK Notify (TR_NOTIFY_API_KEY) is required.');

module.exports = Object.freeze({
  port: process.env.TR_API_PORT,
  databaseHost: process.env.LICENSING_DB_HOST,
  licensingPassword: process.env.LICENSING_DB_PASS,
  trapsPassword: process.env.TR_DB_PASS,
  pathPrefix: process.env.TR_API_PATH_PREFIX ? `/${process.env.TR_API_PATH_PREFIX}` : '/trap-registration-api',
  notifyApiKey: process.env.TR_NOTIFY_API_KEY
});
