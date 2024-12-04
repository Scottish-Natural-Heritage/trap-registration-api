const {UUID, UUIDV4} = require('sequelize');

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.dropTable('RegistrationHistory');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('RegistrationHistory', {
      revisionId: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      RegistrationId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Registrations',
          key: 'id'
        }
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
      },
      createdByLicensingOfficer: {
        type: Sequelize.STRING
      },
      expiryDate: {
        type: Sequelize.DATE
      },
      uprn: {
        type: Sequelize.STRING
      }
    });
  }
};
