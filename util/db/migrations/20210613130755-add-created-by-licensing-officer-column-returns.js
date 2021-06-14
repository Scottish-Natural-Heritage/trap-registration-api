'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'createdByLicensingOfficer',
      Sequelize.STRING
    );
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'createdByLicensingOfficer'
    );
  }
};
