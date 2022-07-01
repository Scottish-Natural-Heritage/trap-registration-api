'use strict';

// The pre-migrations only make sense when running inside the production docker
// environment. They are not required for the development SQLite DB.
if (process.env.NODE_ENV === 'production') {
  module.exports = {
    up: (queryInterface) => queryInterface.createSchema('traps'),
    down: (queryInterface) => queryInterface.dropSchema('traps')
  };
} else {
  module.exports = {
    up: () => Promise.resolve(),
    down: () => Promise.resolve()
  };
}
