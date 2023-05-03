import Sequelize from 'sequelize';
import dbConfig from '../config/database.js';

import Registration from './registration.js';
import Return from './return.js';
import NonTargetSpecies from './non-target-species.js';
import Revocation from './revocation.js';
import Note from './note.js';

const sequelize = new Sequelize(dbConfig.database);

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Registration = Registration(sequelize, Sequelize);
db.Return = Return(sequelize, Sequelize);
db.NonTargetSpecies = NonTargetSpecies(sequelize, Sequelize);
db.Revocation = Revocation(sequelize, Sequelize);
db.Note = Note(sequelize, Sequelize);

db.Registration.hasMany(db.Return);
db.Registration.hasOne(db.Revocation);
db.Return.belongsTo(db.Registration);
db.Return.hasMany(db.NonTargetSpecies);
db.NonTargetSpecies.belongsTo(db.Return);
db.Revocation.belongsTo(db.Registration);
db.Registration.hasMany(db.Note);
db.Note.belongsTo(db.Registration);

export {db as default};
