'use strict';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('RequestUUID', {
      uuid: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deletedAt: {
        type: Sequelize.DATE
      }
    }),
  down: (queryInterface) => queryInterface.dropTable('RequestUUID')
};
