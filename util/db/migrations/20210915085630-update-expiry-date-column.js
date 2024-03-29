'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      // Grab the registrations as an array of objects.
      const resultsArray = await queryInterface.sequelize.query('SELECT * FROM traps."Registrations";', {
        type: Sequelize.QueryTypes.SELECT
      });

      // Loop through the results and add an expiry date value, calculated from the createdAt field.
      for (const result of resultsArray) {
        // Get the date the registration was created on.
        result.expiryDate = new Date(result.createdAt);
        // Add 4 years.
        result.expiryDate.setFullYear(result.expiryDate.getFullYear() + 4);
        // Set the month to December and the date to the 31st.
        result.expiryDate.setMonth(11, 31);
      }

      const updateQueries = [];
      // Loop through the updated results and update the expiryDate field with the new value.
      for (const result of resultsArray) {
        updateQueries.push(
          queryInterface.sequelize.query(`UPDATE traps."Registrations" SET "expiryDate" = ? WHERE id = ?;`, {
            replacements: [result.expiryDate, result.id],
            type: Sequelize.QueryTypes.UPDATE
          })
        );
      }

      await Promise.all(updateQueries);
    },
    down: async (queryInterface, Sequelize) => {
      // For the opposite set all expiry date values to null.
      await queryInterface.sequelize.query(`UPDATE traps."Registrations" SET "expiryDate" = null;`, {
        type: Sequelize.QueryTypes.UPDATE
      });
    }
  };
} else {
  module.exports = {
    up: async (queryInterface, Sequelize) => {
      // Grab the registrations as an array of objects.
      const resultsArray = await queryInterface.sequelize.query('SELECT * FROM Registrations;', {
        type: Sequelize.QueryTypes.SELECT
      });

      // Loop through the results and add an expiry date value, calculated from the createdAt field.
      for (const result of resultsArray) {
        // Get the date the registration was created on.
        result.expiryDate = new Date(result.createdAt);
        // Add 4 years.
        result.expiryDate.setFullYear(result.expiryDate.getFullYear() + 4);
        // Set the month to December and the date to the 31st.
        result.expiryDate.setMonth(11, 31);
      }

      const updateQueries = [];
      // Loop through the updated results and update the expiryDate field with the new value.
      for (const result of resultsArray) {
        updateQueries.push(
          queryInterface.sequelize.query(`UPDATE Registrations SET expiryDate = ? WHERE id = ?;`, {
            replacements: [result.expiryDate, result.id],
            type: Sequelize.QueryTypes.UPDATE
          })
        );
      }

      await Promise.all(updateQueries);
    },
    down: async (queryInterface, Sequelize) => {
      // For the opposite set all expiry date values to null.
      await queryInterface.sequelize.query(`UPDATE Registrations SET expiryDate = null;`, {
        type: Sequelize.QueryTypes.UPDATE
      });
    }
  };
}
