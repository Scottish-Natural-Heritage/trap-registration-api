'use strict';

const config = require('../../../src/config/database.js').ssDatabase;

if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('ALTER ROLE rotraps WITH PASSWORD :roTrapsPassword;', {
        type: Sequelize.QueryTypes.RAW,
        replacements: {
          roTrapsPassword: config.password
        }
      });

      await queryInterface.sequelize.query('revoke traps from licensing;', {
        type: Sequelize.QueryTypes.RAW
      });
    },

    down: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('grant traps to licensing;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query("ALTER ROLE rotraps WITH PASSWORD 'override_this_value';", {
        type: Sequelize.QueryTypes.RAW
      });
    }
  };
} else {
  module.exports = {
    up: () => Promise.resolve(),
    down: () => Promise.resolve()
  };
}
