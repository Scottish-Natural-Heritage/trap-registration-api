import db from '../../models/index.js';

const {Registration} = db;

const RenewalController = {
  findAllForRegistration: async (registrationId) => {
    if (Number.isNaN(registrationId)) {
      return {status: 404, id: registrationId};
    }

    const registration = await Registration.findByPk(registrationId);

    return Registration.findAll({where: {trapId: registration.trapId, registrationType: 'Renewal'}});
  }
};

export {RenewalController as default};
