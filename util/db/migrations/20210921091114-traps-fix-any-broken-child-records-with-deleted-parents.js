'use strict';
if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query(
        `
        UPDATE traps."Returns" SET "deletedAt" = CURRENT_TIMESTAMP WHERE "deletedAt" IS NULL AND "RegistrationId" IN (SELECT id FROM traps."Registrations" WHERE "deletedAt" IS NOT NULL)`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE traps."NonTargetSpecies" SET "deletedAt" = CURRENT_TIMESTAMP WHERE "deletedAt" IS NULL AND "ReturnId" IN (SELECT id FROM traps."Returns" WHERE "deletedAt" IS NOT NULL)`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    },

    down: async (_queryInterface, _Sequelize) => {
      return Promise.resolve();
    }
  };
} else {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      await queryInterface.sequelize.query(
        `
        UPDATE "Returns" SET "deletedAt" = CURRENT_TIMESTAMP WHERE "deletedAt" IS NULL AND "RegistrationId" IN (SELECT id FROM "Registrations" WHERE "deletedAt" IS NOT NULL)`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );

      await queryInterface.sequelize.query(
        `
        UPDATE "NonTargetSpecies" SET "deletedAt" = CURRENT_TIMESTAMP WHERE "deletedAt" IS NULL AND "ReturnId" IN (SELECT id FROM "Returns" WHERE "deletedAt" IS NOT NULL)`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    },

    down: async (_queryInterface, _Sequelize) => {
      return Promise.resolve();
    }
  };
}
