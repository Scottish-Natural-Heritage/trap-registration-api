'use strict';

// The pre-migrations only make sense when running inside the production docker
// environment. They are not required for the development SQLite DB.
if (process.env.NODE_ENV === 'production') {
  // Even though this is a 'pre-migrations' migration, we need to import the
  // production config as we're setting the password the production account will
  // use.
  const config = require('../../../src/config/database.js').database;

  module.exports = {
    up: (queryInterface, Sequelize) =>
      queryInterface.sequelize.query('create role traps with noinherit login password :trapsPassword;', {
        type: Sequelize.QueryTypes.RAW,
        replacements: {
          trapsPassword: config.password
        }
      }),
    down: (queryInterface, Sequelize) =>
      queryInterface.sequelize.query('drop role traps;', {
        type: Sequelize.QueryTypes.RAW
      })
  };
} else {
  module.exports = {
    up: () => Promise.resolve(),
    down: () => Promise.resolve()
  };
}
