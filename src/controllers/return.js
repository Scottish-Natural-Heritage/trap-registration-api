// eslint-disable-next-line unicorn/import-index, import/no-useless-path-segments
import db from '../models/index.js';
import Sequelize from 'sequelize';

const {Return, NonTargetSpecies} = db;

/**
 * Attempt to create an empty, randomly allocated Return.
 *
 * Generates a random number and attempts to create an empty record in the
 * database with that ID. If it fails because another record already exists,
 * then it returns undefined. If any errors occur, it bubbles them back to the
 * calling code.
 *
 * @returns {Sequelize.Model | undefined} A new empty model is successful,
 * otherwise undefined.
 */
const tryCreate = async () => {
  try {
    // Generate a random 5 digit number and attempt to create a new record with
    // that ID.
    const newReturn = await Return.create({id: Math.floor(Math.random() * 99999)});

    // X.create only ever returns if it's successful, so we can just return our
    // new model.
    return newReturn;
  } catch (error) {
    // There are two possible error conditions here...

    // The first is if we try to create a duplicate ID, which we manually check
    // for and return undefined as an indicator.
    if (error instanceof Sequelize.UniqueConstraintError) {
      return undefined;
    }

    // The second error condition is 'anything else' i.e. a proper DB error. In
    // that case, just throw it up to the calling code.
    throw error;
  }
};

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
    let newReturn;
    let remainingAttempts = 10;
    // Loop until we have a new empty Return or we run out of attempts,
    // whichever happens first.
    while (newReturn === undefined && remainingAttempts > 0) {
      newReturn = await tryCreate(); // eslint-disable-line no-await-in-loop
      remainingAttempts--;
    }

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
