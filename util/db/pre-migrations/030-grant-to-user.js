'use strict';

// The pre-migrations only make sense when running inside the production docker
// environment. They are not required for the development SQLite DB.
if (process.env.NODE_ENV === 'production') {
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
} else {
  module.exports = {
    up: () => {
      return Promise.resolve();
    },
    down: () => {
      return Promise.resolve();
    }
  };
}
