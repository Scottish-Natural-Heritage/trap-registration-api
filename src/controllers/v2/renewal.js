import {Op} from 'sequelize';
import db from '../../models/index.js';

const {Registration} = db;

const RenewalController = {
  findAllForRegistration: async (registrationId) => {
    if (Number.isNaN(registrationId)) {
      return {status: 404, id: registrationId};
    }

    const registration = await Registration.findByPk(registrationId, {paranoid: false});

    return Registration.findAll({
      where: {
        trapId: registration.trapId,
        id: {[Op.ne]: registration.id}
      },
      order: [['expiryDate', 'DESC']],
      paranoid: false
    });
  }
};

export {RenewalController as default};
