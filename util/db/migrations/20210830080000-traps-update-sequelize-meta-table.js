'use strict';
if (process.env.NODE_ENV === 'production') {
  module.exports = {
    async up(queryInterface, Sequelize) {
      await queryInterface.sequelize.query(
        `UPDATE traps."SequelizeMeta" SET name = '20210830132333-traps-create-views.js' WHERE name = '20213008132333-traps-create-views.js';`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    },
    async down(queryInterface, Sequelize) {
      await queryInterface.sequelize.query(
        `UPDATE traps."SequelizeMeta" SET name = '20213008132333-traps-create-views.js' WHERE name = '20210830132333-traps-create-views.js';`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }
  };
} else {
  module.exports = {
    async up(queryInterface, Sequelize) {
      await queryInterface.sequelize.query(
        `UPDATE SequelizeMeta SET name = '20210830132333-traps-create-views.js' WHERE name = '20213008132333-traps-create-views.js';`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    },
    async down(queryInterface, Sequelize) {
      await queryInterface.sequelize.query(
        `UPDATE SequelizeMeta SET name = '20213008132333-traps-create-views.js' WHERE name = '20210830132333-traps-create-views.js';`,
        {
          type: Sequelize.QueryTypes.UPDATE
        }
      );
    }
  };
}
