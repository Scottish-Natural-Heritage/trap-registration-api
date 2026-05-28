'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'isRevoked',
      Sequelize.BOOLEAN
    );
  },
  async down(queryInterface) {
    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Revocations'
      },
      'isRevoked'
    );
  }
};
