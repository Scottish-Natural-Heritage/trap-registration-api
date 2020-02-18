'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query('grant connect on database licensing to traps;', {
        type: Sequelize.QueryTypes.RAW
      }),
      queryInterface.sequelize.query('grant all on schema traps to traps;', {
        type: Sequelize.QueryTypes.RAW
      })
    ]);
  },
  down: (queryInterface, Sequelize) => {
    return Promise.all([
      queryInterface.sequelize.query('revoke all on schema traps from traps;', {
        type: Sequelize.QueryTypes.RAW
      }),
      queryInterface.sequelize.query('revoke all on database licensing from traps;', {
        type: Sequelize.QueryTypes.RAW
      })
    ]);
  }
};
