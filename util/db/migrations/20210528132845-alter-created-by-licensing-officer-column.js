'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Registrations'
      },
      'createdByLicensingOfficer'
    );
    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Registrations'
      },
      'createdByLicensingOfficer',
      Sequelize.STRING
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Registrations'
      },
      'createdByLicensingOfficer'
    );
    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Registrations'
      },
      'createdByLicensingOfficer',
      Sequelize.BOOLEAN
    );
  }
};
