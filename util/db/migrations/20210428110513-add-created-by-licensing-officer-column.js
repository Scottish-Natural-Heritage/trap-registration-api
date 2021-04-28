'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Registrations', 'createdByLicensingOfficer', {type: Sequelize.BOOLEAN});
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Registrations', 'createdByLicensingOfficer');
  }
};
