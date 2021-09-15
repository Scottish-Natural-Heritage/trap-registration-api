'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Grab the id and createdAt value of any existing registration.
    const resultsArray = await queryInterface.sequelize.query(
      'SELECT * FROM Registrations;',
      {
        type: Sequelize.QueryTypes.RAW
      }
    );

    // Loop through the results and add an expiry date value, calculated from the createdAt field.
    for (const result of resultsArray) {
      // Get the createdAt timestamp.
      result.expiryDate = new Date(result.createdAt);
      // Add 5 years.
      result.expiryDate.setFullYear(result.expiryDate.getFullYear() + 5);
      //Subtract 1 day.
      result.expiryDate.setDate(result.expiryDate.getDate() - 1);
    }

    // Loop through the updated results and update the expiryDate field with the new value.
    for (const result of resultsArray) {
      await queryInterface.sequelize.query(
        `UPDATE Registrations SET expiryDate = ? WHERE id = ?;`,
        {
          replacements: [result.expiryDate, result.id],
          type: Sequelize.QueryTypes.RAW
        }
      );
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Put the opposite here.
  }
};
