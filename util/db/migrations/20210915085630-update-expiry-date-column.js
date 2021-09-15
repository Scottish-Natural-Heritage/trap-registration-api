'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Grab the registrations as an array of objects.
    const resultsArray = await queryInterface.sequelize.query('SELECT * FROM Registrations;', {
      type: Sequelize.QueryTypes.SELECT
    });

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
      await queryInterface.sequelize.query(`UPDATE Registrations SET expiryDate = ? WHERE id = ?;`, {
        replacements: [result.expiryDate, result.id],
        type: Sequelize.QueryTypes.UPDATE
      });
    }
  },
  down: async (queryInterface, Sequelize) => {
    // Put the opposite here.
    const resultsArray = await queryInterface.sequelize.query('SELECT * FROM Registrations;', {
      type: Sequelize.QueryTypes.SELECT
    });

    // Loop through the results and set the expiry date to null.
    for (const result of resultsArray) {
      result.expiryDate = null;
    }

    // Loop through the updated results and update the expiryDate field with null.
    for (const result of resultsArray) {
      await queryInterface.sequelize.query(`UPDATE Registrations SET expiryDate = ? WHERE id = ?;`, {
        replacements: [result.expiryDate, result.id],
        type: Sequelize.QueryTypes.UPDATE
      });
    }
  }
};
