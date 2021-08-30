'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query(
        'CREATE VIEW non_target_species_traps_v AS SELECT * FROM traps."NonTargetSpecies";',
        {
          type: Sequelize.QueryTypes.RAW
        }
      );

      await queryInterface.sequelize.query(
        'CREATE VIEW registrations_traps_v AS SELECT * FROM traps."Registrations";',
        {
          type: Sequelize.QueryTypes.RAW
        }
      );

      await queryInterface.sequelize.query('CREATE VIEW returns_traps_v AS SELECT * FROM traps."Returns";', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('CREATE VIEW revocations_traps_v AS SELECT * FROM traps."Revocations";', {
        type: Sequelize.QueryTypes.RAW
      });
    },
    down: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query('DROP VIEW revocations_traps_v;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('DROP VIEW returns_traps_v;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('DROP VIEW registrations_traps_v;', {
        type: Sequelize.QueryTypes.RAW
      });

      await queryInterface.sequelize.query('DROP VIEW non_target_species_traps_v;', {
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
