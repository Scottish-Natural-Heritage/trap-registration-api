'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  async up(queryInterface, Sequelize) {
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
  async down(queryInterface, Sequelize) {
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
