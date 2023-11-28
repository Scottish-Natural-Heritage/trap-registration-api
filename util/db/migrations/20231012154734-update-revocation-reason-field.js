'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'reason',
      Sequelize.TEXT
    );
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.changeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'reason',
      Sequelize.STRING
    );
  }
};
