'use strict';

module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('RegistrationNumbers', {
      RegistrationNumber: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      RegistrationId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
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
  down: (queryInterface) => queryInterface.dropTable('RegistrationNumbers')
};
