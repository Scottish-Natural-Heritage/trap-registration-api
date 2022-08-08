'use strict';
const databaseConfig = require('../../../src/config/database.js');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'year',
      Sequelize.STRING
    );

    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'numberLarsenMate',
      Sequelize.INTEGER
    );

    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'numberLarsenPod',
      Sequelize.INTEGER
    );

    await queryInterface.addColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'noMeatBaitsUsed',
      Sequelize.BOOLEAN
    );
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'noMeatBaitsUsed'
    );

    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'numberLarsenPod'
    );

    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'numberLarsenMate'
    );

    await queryInterface.removeColumn(
      {
        schema: databaseConfig.database.schema,
        tableName: 'Returns'
      },
      'year'
    );
  }
};
