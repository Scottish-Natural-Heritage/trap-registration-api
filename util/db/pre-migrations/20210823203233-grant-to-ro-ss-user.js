'use strict';

// The pre-migrations only make sense when running inside the production docker
// environment. They are not required for the development SQLite DB.
if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('grant connect on database licensing to rotraps;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('grant usage on schema traps to rotraps;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('grant select on all tables in schema traps to rotraps;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('grant traps to licensing;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query(
        'alter default privileges for role licensing, traps in schema traps grant select on tables to rotraps;',
        {
          type: Sequelize.QueryTypes.RAW
        }
      );
    },
    down: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query(
        'alter default privileges for role licensing, traps in schema traps revoke select on tables to rotraps;',
        {
          type: Sequelize.QueryTypes.RAW
        }
      );

      await queryInterface.sequelize.query('revoke traps from licensing;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('revoke select on schema traps from rotraps;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('revoke usage on schema traps from rotraps;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('revoke all on database licensing from rotraps;', {
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
