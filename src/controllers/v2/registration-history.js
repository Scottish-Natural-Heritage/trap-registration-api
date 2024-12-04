import db from '../../models/index.js';

const {RegistrationHistory} = db;

const RegistrationHistoryController = {
  findOne: async (id) => RegistrationHistory.findByPk(id),

  findAllForRegistration: async (registrationId) =>
    RegistrationHistory.findAll({where: {RegistrationId: registrationId}}),

  findAll: async () => RegistrationHistory.findAll()
};

export {RegistrationHistoryController as default};
