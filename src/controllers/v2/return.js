import db from '../../models/index.js';

const {Return, NonTargetSpecies} = db;

const ReturnController = {
  /**
   * Retrieve the specified Return from the database.
   *
   * @param {Number} id a Return's ID
   * @returns a Return
   */
  findOne: async (id) => {
    return Return.findByPk(id, {include: NonTargetSpecies});
  },

  /**
   * Retrieve all returns from the database.
   *
   * @returns all returns
   */
  findAll: async () => {
    return Return.findAll();
  },

  /**
   * Retrieve all returns for a specified registration.
   * @param {number} id a Registration's ID
   * @returns all returns associated with a registration
   */
  findRegReturns: async (id) => {
    return Return.findAll({
      where: {
        RegistrationId: id
      },
      include: NonTargetSpecies
    });
  },
};

export {ReturnController as default};
