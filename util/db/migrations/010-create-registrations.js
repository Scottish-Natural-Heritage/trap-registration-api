'use strict';
module.exports = {
  up: (queryInterface, Sequelize) =>
    queryInterface.createTable('Registrations', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      convictions: {
        type: Sequelize.BOOLEAN
      },
      usingGL01: {
        type: Sequelize.BOOLEAN
      },
      usingGL02: {
        type: Sequelize.BOOLEAN
      },
      usingGL03: {
        type: Sequelize.BOOLEAN
      },
      complyWithTerms: {
        type: Sequelize.BOOLEAN
      },
      meatBaits: {
        type: Sequelize.BOOLEAN
      },
      fullName: {
        type: Sequelize.STRING
      },
      addressLine1: {
        type: Sequelize.STRING
      },
      addressLine2: {
        type: Sequelize.STRING
      },
      addressTown: {
        type: Sequelize.STRING
      },
      addressCounty: {
        type: Sequelize.STRING
      },
      addressPostcode: {
        type: Sequelize.STRING
      },
      phoneNumber: {
        type: Sequelize.STRING
      },
      emailAddress: {
        type: Sequelize.STRING
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
  down: (queryInterface) => queryInterface.dropTable('Registrations')
};
