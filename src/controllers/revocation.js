// eslint-disable-next-line unicorn/import-index, import/no-useless-path-segments
import db from '../models/index.js';

const {Revocation} = db;

/**
 * An object to perform 'persistence' operations on our Revocation objects.
 */
const RevocationController = {
  /**
   * Create a new randomly allocated Revocation.
   *
   * @returns {Number} ID of the new Revocation
   */
  create: async () => {
    const newRevocation = await Revocation.create();
    // If we fail to create let the calling code know by raising an error.
    if (newRevocation === undefined) {
      throw new Error('Unable to generate new Revocation.');
    }

    // On success, return the new Revocation's ID.
    return newRevocation.id;
  },

  /**
   * Retrieve the specified Revocation from the database.
   *
   * @param {Number} id an existing revocation's ID
   * @returns an existing revocation
   */
  findOne: async (id) => {
    return Revocation.findByPk(id);
  },

  /**
   * Retrieve all revocations from the database.
   *
   * @returns all existing revocations
   */
  findAll: async () => {
    return Revocation.findAll();
  },

  /**
   * Replace a revocation in the database with our new JSON model.
   *
   * @param {Number} id an existing revocation's ID
   * @param {any} revocation a JSON version of the model to replace the database's copy
   * @returns {boolean} true if the record is updated, otherwise false
   */
  update: async (id, revocation) => {;
    // Save the new values to the database.
    const result = await Revocation.update(revocation, {where: {id}});
    // Check to make sure the saving process went OK.
    const success = result.length > 0 && result[0] === 1;
    if (success) {
      // Return the object to the caller, for them to send back to the client.
      return result;
    }

    // If something went wrong, return undefined to signify this.
    return undefined;
  }
};

export {RevocationController as default};
