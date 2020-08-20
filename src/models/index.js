import dbConfig from '../config/database.js';
import Sequelize from 'sequelize';

import Registration from './registration.js';

const sequelize = new Sequelize(dbConfig.database);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Registration = Registration(sequelize, Sequelize);

export {db as default};
