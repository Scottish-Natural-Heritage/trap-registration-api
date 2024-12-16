'use strict';

module.exports = {
  up: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      // Adding a comment
      const tableName = process.env.NODE_ENV === 'production' ? 'licensing.traps."Registrations"' : '"Registrations"';

      await queryInterface.sequelize.query(
        `
				UPDATE ${tableName}
				SET "trapId" = "id", "registrationType" = 'Initial'
				WHERE "registrationType" IS NULL; 
      `,
        {transaction: t}
      );
    }),

  down: async (queryInterface) =>
    queryInterface.sequelize.transaction(async (t) => {
      const tableName = process.env.NODE_ENV === 'production' ? 'licensing.traps."Registrations"' : '"Registrations"';

      await queryInterface.sequelize.query(
        `
				UPDATE ${tableName}
				SET "trapId" = NULL, "registrationType" = NULL; 
      `,
        {transaction: t}
      );
    })
};
