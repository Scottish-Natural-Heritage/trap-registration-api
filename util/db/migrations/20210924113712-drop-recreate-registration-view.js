'use strict';
if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('DROP VIEW traps_Registrations;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('CREATE VIEW traps_Registrations AS SELECT * FROM traps."Registrations";', {
        type: Sequelize.QueryTypes.RAW
      });
    },

    down: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('DROP VIEW traps_Registrations;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('CREATE VIEW traps_Registrations AS SELECT * FROM traps."Registrations";', {
        type: Sequelize.QueryTypes.RAW
      });
    }
  };
} else {
  module.exports = {
    up: () => {
      return Promise.resolve();
    },
    down: () => {
      return Promise.resolve();
    }
  };
}
