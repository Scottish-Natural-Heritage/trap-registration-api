'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'revokedBy'
    );
    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'createdBy',
      Sequelize.STRING
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'createdBy'
    );
    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'revokedBy',
      Sequelize.STRING
    );
  }
};
