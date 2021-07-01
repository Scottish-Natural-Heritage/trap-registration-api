import db from '../../models/index.js';

const {Registration, Return, NonTargetSpecies} = db;

/**
 * An object to perform 'persistence' operations on our registration objects.
 */
 const RegistrationController = {

  /**
   * Retrieve the specified registration from the database.
   *
   * @param {Number} id an existing registration's ID
   * @returns an existing registration
   */
  findOne: async (id) => {
    return Registration.findByPk(id, {include: [{model: Return, include: NonTargetSpecies}]});
  },

  /**
   * Retrieve all registrations from the database.
   *
   * @returns all existing registrations
   */
  findAll: async () => {
    return Registration.findAll();
  },

  /**
   * Update a registration in the database with partial JSON model.
   *
   * @param {Number} id an existing registration's ID
   * @param {any} reg a JSON version of the model containing only the fields to be updated
   * @returns {boolean} true if the record is updated, otherwise false
   */
  update: async (id, reg) => {
    // Save the new values to the database.
    const result = await Registration.update(reg, {where: {id}});

    // Check to make sure the saving process went OK.
    const success = result.length > 0 && result[0] === 1;
    if (success) {
      return true;
    }

    // If something went wrong, return undefined to signify this.
    return undefined;
  },
};

export {RegistrationController as default};
