const assert = require('assert');

// Declare up front what env vars we need to continue and ensure they're set.
assert(process.env.PORT !== undefined, 'A port number (PORT) is required.');
assert(
  process.env.LICENSING_DB_HOST !== undefined,
  'A hostname for the licensing database (LICENSING_DB_HOST) is required.'
);
assert(
  process.env.LICENSING_DB_PASS !== undefined,
  'A password for the licensing user (LICENSING_DB_PASS) is required.'
);
assert(process.env.TRAPS_DB_PASS !== undefined, 'A password for the traps user (TRAPS_DB_PASS) is required.');
assert(process.env.NOTIFY_API_KEY !== undefined, 'An API Key for GOV.UK Notify (NOTIFY_API_KEY) is required.');

module.exports = Object.freeze({
  port: process.env.PORT,
  databaseHost: process.env.LICENSING_DB_HOST,
  licensingPassword: process.env.LICENSING_DB_PASS,
  trapsPassword: process.env.TRAPS_DB_PASS,
  pathPrefix: process.env.PATH_PREFIX || '',
  notifyApiKey: process.env.NOTIFY_API_KEY
});
