'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) =>
    Promise.all([
      queryInterface.addColumn(
        'Registrations', // Table name
        'trapId', // New field name
        {
          type: Sequelize.INTEGER,
          allowNull: true
        }
      ),
      queryInterface.addColumn('Registrations', 'registrationType', {
        type: Sequelize.STRING,
        allowNull: true
      })
    ]),

  down: async (queryInterface, _Sequelize) =>
    Promise.all([
      queryInterface.removeColumn('Registrations', 'trapId'),
      queryInterface.removeColumn('Registrations', 'registrationType')
    ])
};
