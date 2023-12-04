import db from '../../models/index.js';

const {Return, NonTargetSpecies} = db;

const ReturnController = {
  /**
   * Retrieve the specified Return from the database.
   *
   * @param {Number} id a Return's ID
   * @returns a Return
   */
  findOne: async (id) => Return.findByPk(id, {include: NonTargetSpecies}),

  /**
   * Retrieve all returns from the database.
   *
   * @returns all returns
   */
  findAll: async () => Return.findAll(),

  /**
   * Retrieve all returns for a specified registration.
   * @param {number} id a Registration's ID
   * @returns all returns associated with a registration
   */
  findRegReturns: async (id) =>
    Return.findAll({
      where: {
        RegistrationId: id
      },
      include: NonTargetSpecies
    }),

  /**
   * Create a new Return.
   *
   * @returns {Number} ID of the new Return
   */
  create: async (cleanedReturn) => {
    // Split the incoming json blob in to each object to be persisted.
    const {nonTargetSpecies, ...returnObject} = cleanedReturn;
    let createdReturn;
    try {
      // Start the database transaction.
      await db.sequelize.transaction(async (t) => {
        // Add the return to the database.
        createdReturn = await Return.create(returnObject, {transaction: t});

        // Loop over the array of non target species we've received and map them into an array
        // of promises and then resolve them all so that they...
        await Promise.all(
          nonTargetSpecies.map(async (jsonNonTargetSpecies) => {
            // Create the new non-target species object and put it in the database.
            const speciesCaught = await NonTargetSpecies.create(
              {
                ReturnId: createdReturn.id,
                gridReference: jsonNonTargetSpecies.gridReference,
                speciesCaught: jsonNonTargetSpecies.speciesCaught,
                numberCaught: jsonNonTargetSpecies.numberCaught,
                trapType: jsonNonTargetSpecies.trapType,
                comment: jsonNonTargetSpecies.comment
              },
              {transaction: t}
            );

            // Associate the speciesCaught to the return.
            await speciesCaught.setReturn(createdReturn, {transaction: t});
          })
        );
      });
    } catch {
      // When anything goes return undefined to the router so it can tell the client.
      return undefined;
    }

    // Return the ID of the newly created return.
    return createdReturn.id;
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
