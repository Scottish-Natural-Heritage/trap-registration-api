import Sequelize from 'sequelize';
import dbConfig from '../config/database.js';
import Registration from './registration.js';
import Return from './return.js';
import NonTargetSpecies from './non-target-species.js';
import Revocation from './revocation.js';
import Note from './note.js';
import RequestUUID from './request-uuid.js';

const sequelize = new Sequelize(dbConfig.database);

const database = {};
database.Sequelize = Sequelize;
database.sequelize = sequelize;
database.Registration = Registration(sequelize, Sequelize);
database.Return = Return(sequelize, Sequelize);
database.NonTargetSpecies = NonTargetSpecies(sequelize, Sequelize);
database.Revocation = Revocation(sequelize, Sequelize);
database.Note = Note(sequelize, Sequelize);
database.RequestUUID = RequestUUID(sequelize, Sequelize);

database.Registration.hasMany(database.Return);
database.Registration.hasOne(database.Revocation);
database.Return.belongsTo(database.Registration);
database.Return.hasMany(database.NonTargetSpecies);
database.NonTargetSpecies.belongsTo(database.Return);
database.Revocation.belongsTo(database.Registration);
database.Registration.hasMany(database.Note);
database.Note.belongsTo(database.Registration);

export {database as default};
