import db from '../../models/index.js';

const {Registration, Return, NonTargetSpecies, Revocation} = db;

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
    return Registration.findByPk(id, {
      include: [
        {
          model: Return,
          include: [
            {
              model: NonTargetSpecies
            }
          ]
        }
      ]
    });
  },

  /**
   * Retrieve all registrations from the database.
   *
   * @returns all existing registrations
   */
  findAll: async () => {
    return Registration.findAll();
  },

  create: async (reg) => {
    let newReg;
    let remainingAttempts = 10;
    // Loop until we have a new empty registration or we run out of attempts,
    // whichever happens first.
    while (newReg === undefined && remainingAttempts > 0) {
      try {
        // Generate a random ID for the registration.
        const regId = Math.floor(Math.random() * 99_999);
        // Begin the database transaction.
        await db.sequelize.transaction(async (t) => {
          // First check if the ID has already been used by another registration.
          newReg = await Registration.findByPk(regId, {transaction: t})
          // If the ID is not in use we can use it.
          if (newReg === null) {
            reg.id = regId;
            newReg = await Registration.create(reg, {transaction: t});
          } else {
            // If the ID is in use set newReg to undefined and try again.
            newReg = undefined;
          }
        });
        remainingAttempts--;
      } catch (error) {
        newReg = undefined;
      }
    }
    // If we run out of attempts let the calling code know by raising an error.
    if (newReg === undefined) {
      throw new Error('Unable to generate new registration number.');
    }

    // On success, return the new registration's ID.
    return newReg.id
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
      // Return JSON with the updated fields on successful update.
      return reg;
    }

    // If something went wrong, return undefined to signify this.
    return undefined;
  },

  /**
   * Soft delete a registration in the database.
   *
   * @param {Number} id a possible ID of a registration.
   * @param {Object} cleanObject an new revocation object to be added to the database.
   * @returns {boolean} true if the record is deleted, otherwise false
   */
   delete: async (id, cleanObject) => {
    try {
      await db.sequelize.transaction(async (t) => {
        await Registration.findByPk(id, {transaction: t, rejectOnEmpty: true});
        await Revocation.create(cleanObject, {transaction: t});
        await Registration.destroy({where: {id}, transaction: t});
        return true;
      });
    } catch {
      return false;
    }
  }
};

export {RegistrationController as default};
