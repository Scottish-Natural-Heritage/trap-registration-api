import db from '../../models/index.js';

const {RegistrationNumber} = db;

const RegistrationNumberController = {
  /**
   * Retrieve the specified RegistrationNumber from the database.
   *
   * @param {Number} id a RegistrationNumber's ID
   * @returns a RegistrationNumber
   */
  findOne: async (RegistrationNumber, RegistrationId) =>
    RegistrationNumber.findByPk(RegistrationNumber, RegistrationId),

  /**
   * Retrieve all RegistrationNumbers from the database.
   *
   * @returns all RegistrationNumbers
   */
  findAll: async () => RegistrationNumber.findAll(),

  /**
   * Create a new RegistrationNumber.
   *
   * @returns Composite ID of the new RegistrationNumber
   */
  create: async (incomingRegistrationNumber) => {
    let newRegistrationNumber;
    // Start the database transaction.
    await db.sequelize.transaction(async (t) => {
      // Add the RegistrationNumber to the database.
      newRegistrationNumber = await RegistrationNumber.create(incomingRegistrationNumber, {transaction: t});
    });
    // If all went well and we have a new RegistrationNumber return it.
    if (newRegistrationNumber) {
      return newRegistrationNumber;
    }

    // When anything goes askance return `undefined` to the router so it can tell the client.
    return undefined;
  }
};

export {RegistrationNumberController as default};
