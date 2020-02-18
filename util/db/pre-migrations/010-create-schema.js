'use strict';

module.exports = {
  up: (queryInterface) => {
    return queryInterface.createSchema('traps');
  },
  down: (queryInterface) => {
    return queryInterface.dropSchema('traps');
  }
};
