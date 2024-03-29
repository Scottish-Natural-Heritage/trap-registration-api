'use strict';

const config = require('../../../src/config/database.js').ssDatabase;

if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) =>
      queryInterface.sequelize.query('ALTER ROLE rotraps WITH PASSWORD :roTrapsPassword;', {
        type: Sequelize.QueryTypes.RAW,
        replacements: {
          roTrapsPassword: config.password
        }
      }),

    down: async (queryInterface, Sequelize) =>
      queryInterface.sequelize.query("ALTER ROLE rotraps WITH PASSWORD 'override_this_value';", {
        type: Sequelize.QueryTypes.RAW
      })
  };
} else {
  module.exports = {
    up: () => Promise.resolve(),
    down: () => Promise.resolve()
  };
}
