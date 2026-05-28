'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  async up(queryInterface, Sequelize) {
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
  async down(queryInterface, Sequelize) {
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
