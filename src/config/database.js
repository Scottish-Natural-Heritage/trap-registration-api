const config = require('./app');

module.exports = {
  preMigrations: {
    username: 'licensing',
    password: config.licensingPassword,
    database: 'licensing',
    host: config.databaseHost,
    dialect: 'postgres',
    schema: 'public',
    logging: false
  },
  production: {
    username: 'traps',
    password: config.trapsPassword,
    database: 'licensing',
    host: config.databaseHost,
    dialect: 'postgres',
    schema: 'traps',
    logging: false
  }
};
