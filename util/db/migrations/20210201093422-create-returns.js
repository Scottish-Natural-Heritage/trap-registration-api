'use strict';
module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable('Returns', {
      id: {
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      nonTargetSpeciesToReport: {
        type: Sequelize.BOOLEAN
      },
      RegistrationId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Registrations',
          key: 'id'
        }
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
    });
  },
  down: (queryInterface) => {
    return queryInterface.dropTable('Returns');
  }
};
