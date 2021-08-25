// Grab our config from the env vars, or set some defaults if they're missing.
module.exports = Object.freeze({
  port: '3001',
  databaseHost: process.env.LICENSING_DB_HOST || 'override_this_value',
  licensingPassword: process.env.LICENSING_DB_PASS || 'override_this_value',
  trapsPassword: process.env.TR_DB_PASS || 'override_this_value',
  roTrapsPassword: process.env.RO_TR_DB_PASS || 'override_this_value',
  pathPrefix: '/trap-registration-api',
  notifyApiKey: process.env.TR_NOTIFY_API_KEY
});
