import db from '../../models/index.js';

const {Return, NonTargetSpecies, Registration} = db;

const ReturnController = {
  /**
   * Retrieve the specified Return from the database.
   *
   * @param {Number} id a Return's ID
   * @returns a Return
   */
  findOne: async (id) => Return.findByPk(id, {include: [{model: NonTargetSpecies}, {model: Registration}]}),

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
      include: [{model: NonTargetSpecies}, {model: Registration}]
    }),

  findRegReturn: async (id) =>
    Return.findByPk({
      where: {
        RegistrationId: id
      },
      include: [{model: NonTargetSpecies}, {model: Registration}]
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
   * Update a registration in the database with partial JSON model.
   *
   * @param {Number} id an existing registration's ID
   * @param {any} jsonReturn a JSON version of the model containing only the fields to be updated
   * @returns {boolean} true if the record is updated, otherwise false
   */
  update: async (id, jsonReturn) => {
    // Save the new values to the database.
    const result = await Return.update(jsonReturn, {where: {id}});

    // Check to make sure the saving process went OK.
    const success = result.length > 0 && result[0] === 1;
    if (success) {
      // Return JSON with the updated fields on successful update.
      return jsonReturn;
    }

    // If something went wrong, return undefined to signify this.
    return undefined;
  }
};

export {ReturnController as default};
