'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create the NonTargetSpecies table
    await queryInterface.createTable('NonTargetSpecies', {
      id: {
        primaryKey: true,
        autoIncrement: true,
        type: Sequelize.INTEGER
      },
      ReturnId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'Returns',
          key: 'id'
        }
      },
      gridReference: {
        allowNull: false,
        type: Sequelize.STRING
      },
      speciesCaught: {
        allowNull: false,
        type: Sequelize.STRING
      },
      numberCaught: {
        allowNull: false,
        type: Sequelize.INTEGER
      },
      trapType: {
        allowNull: false,
        type: Sequelize.STRING
      },
      comment: {
        type: Sequelize.TEXT
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

  async down(queryInterface) {
    await queryInterface.dropTable('NonTargetSpeciesCaught');
  }
};
