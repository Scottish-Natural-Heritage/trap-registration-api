import dbConfig from '../config/database.js';
import Sequelize from 'sequelize';

import Registration from './registration.js';
import Return from './return.js';
import NonTargetSpecies from './non-target-species.js';

const sequelize = new Sequelize(dbConfig.database);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Registration = Registration(sequelize, Sequelize);
db.Return = Return(sequelize, Sequelize);
db.NonTargetSpecies = NonTargetSpecies(sequelize, Sequelize);

db.Registration.hasMany(db.Return);
db.Return.belongsTo(db.Registration);
db.Return.hasMany(db.NonTargetSpecies);
db.NonTargetSpecies.belongsTo(db.Return);

export {db as default};
