import db from '../../models/index.js';

const {Note} = db;

const NoteController = {
  /**
   * Retrieve the specified Note from the database.
   *
   * @param {Number} id a Note's ID
   * @returns a Note
   */
  findOne: async (id) => Note.findByPk(id),

  /**
   * Retrieve all Notes from the database.
   *
   * @returns all note
   */
  findAll: async () => Note.findAll(),

  /**
   * Retrieve all notes for a specified registration.
   * @param {number} id a Note's ID
   * @returns all notes associated with a registration
   */
  findRegistrationNotes: async (id) =>
    Note.findAll({
      where: {
        RegistrationId: id
      }
    }),

  /**
   * Create a new Note.
   *
   * @returns {Number} ID of the new Note
   */
  create: async (registrationId, incomingNote) => {
    // Split the incoming json blob in to each object to be persisted.
    let newNote;
    // Start the database transaction.
    await db.sequelize.transaction(async (t) => {
      incomingNote.RegistrationId = registrationId;
      // Add the note to the database.
      newNote = await Note.create(incomingNote, {transaction: t});
    });
    // If all went well and we have a new application return it.
    if (newNote) {
      return newNote;
    }

    // When anything goes return undefined to the router so it can tell the client.
    return undefined;
  }
};

export {NoteController as default};
