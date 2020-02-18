'use strict';

// Even though this is a 'pre-migrations' migration, we need to import the
// production config as we're setting the password the production account will
// use.
const config = require('../../../src/config/database').production;

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('create role traps with noinherit login password :trapsPassword;', {
      type: Sequelize.QueryTypes.RAW,
      replacements: {
        trapsPassword: config.password
      }
    });
  },
  down: (queryInterface, Sequelize) => {
    return queryInterface.sequelize.query('drop role traps;', {
      type: Sequelize.QueryTypes.RAW
    });
  }
};
