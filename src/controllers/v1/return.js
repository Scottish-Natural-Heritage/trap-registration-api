import db from '../../models/index.js';

const {Return, NonTargetSpecies} = db;

/**
 * An object to perform 'persistence' operations on our Return objects.
 */
const ReturnController = {
  /**
   * Create a new randomly allocated Return.
   *
   * Takes up to 10 attempts to create a new empty Return. If it fails, it throws
   *
   * @returns {Number} ID of the new Return
   */
  create: async () => {
    const newReturn = await Return.create();
    // If we run out of attempts let the calling code know by raising an error.
    if (newReturn === undefined) {
      throw new Error('Unable to generate new Return.');
    }

    // On success, return the new Return's ID.
    return newReturn.id;
  },

  /**
   * Retrieve the specified Return from the database.
   *
   * @param {Number} id an existing Return's ID
   * @returns an existing Return
   */
  findOne: async (id) => {
    return Return.findByPk(id, {include: NonTargetSpecies});
  },

  findRegReturns: async (id) => {
    return Return.findAll({
      where: {
        RegistrationId: id
      },
      include: NonTargetSpecies
    });
  },

  /**
   * Retrieve all returns from the database.
   *
   * @returns all existing returns
   */
  findAll: async () => {
    return Return.findAll();
  },

  /**
   * Replace a return in the database with our new JSON model.
   *
   * @param {number} id An existing returns ID.
   * @param {any} jsonReturn A JSON version of the model to replace the database's copy.
   * @returns {Sequelize.Model} The updated return.
   */
  update: async (id, jsonReturn) => {
    // Grab the already existing object from the database.
    const existingReturn = await Return.findByPk(id);

    // It doesn't exist, you say?
    if (existingReturn === undefined) {
      // Tell the caller.
      return undefined;
    }

    // Split the incoming json blob in to each object to be persisted.
    const {nonTargetSpecies, ...returnObject} = jsonReturn;

    // Update the application object with the new fields.
    const updatedReturn = await existingReturn.update(returnObject);

    // Loop over the array of non target species we've received and map them into an array
    // of promises and then resolve them all so that they...
    await Promise.all(
      nonTargetSpecies.map(async (jsonNonTargetSpecies) => {
        // Create the new sett object.
        const speciesCaught = await NonTargetSpecies.create({
          ReturnId: id,
          gridReference: jsonNonTargetSpecies.gridReference,
          speciesCaught: jsonNonTargetSpecies.speciesCaught,
          numberCaught: jsonNonTargetSpecies.numberCaught,
          trapType: jsonNonTargetSpecies.trapType,
          comment: jsonNonTargetSpecies.comment
        });

        // Associate the speciesCaught to the return.
        await speciesCaught.setReturn(updatedReturn);
      })
    );

    // Fetch the now fully updated return object and return it
    return Return.findByPk(id, {include: NonTargetSpecies});
  }
};

export {ReturnController as default};
