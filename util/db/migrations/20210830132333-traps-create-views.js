'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query(
        'CREATE VIEW traps_NonTargetSpecies AS SELECT * FROM traps."NonTargetSpecies";',
        {
          type: Sequelize.QueryTypes.RAW
        }
      );

      await queryInterface.sequelize.query('CREATE VIEW traps_Registrations AS SELECT * FROM traps."Registrations";', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('CREATE VIEW traps_Returns AS SELECT * FROM traps."Returns";', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('CREATE VIEW traps_Revocations AS SELECT * FROM traps."Revocations";', {
        type: Sequelize.QueryTypes.RAW
      });
    },
    down: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('DROP VIEW traps_Revocations;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('DROP VIEW traps_Returns;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('DROP VIEW traps_Registrations;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('DROP VIEW traps_NonTargetSpecies;', {
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
