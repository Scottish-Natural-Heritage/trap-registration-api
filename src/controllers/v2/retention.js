import database from '../../models/index.js';
import jsonConsoleLogger, {unErrorJson} from '../../json-console-logger.js';

const {Registration, Return, Revocation, Note} = database;
const {Op} = database.Sequelize;

const retentionYears = 5;

const obfuscatedData = {
  fullName: 'REDACTED',
  emailAddress: 'redacted@redacted.redacted',
  phoneNumber: 'REDACTED',
  addressLine1: 'REDACTED',
  addressLine2: null,
  addressTown: 'REDACTED',
  addressCounty: null
};


const findExpiredRegistrationIds = async (cutoffDate) => {
  const rows = await Registration.findAll({
    attributes: ['id'],
    where: {
      expiryDate: {[Op.lt]: cutoffDate},
      fullName: {[Op.ne]: 'REDACTED'}
    },
    include: [
      {
        model: Revocation,
        required: false
      }
    ]
  });

  return rows.filter((r) => !r.Revocation || r.Revocation.isRevoked !== true).map((r) => r.id);
};

const findRevokedRegistrationIds = async (cutoffDate) => {
  const rows = await Registration.findAll({
    attributes: ['id'],
    paranoid: false,
    where: {
      fullName: {[Op.ne]: 'REDACTED'}
    },
    include: [
      {
        model: Revocation,
        required: true,
        paranoid: false, // Use paranoid: false so the update applies to soft deleted rows
        attributes: [],
        where: {
          isRevoked: true,
          createdAt: {[Op.lt]: cutoffDate}
        }
      }
    ]
  });

  return rows.map((r) => r.id);
};


const collectRegistrationIdsForCleanup = async (cutoffDate) => {
  const [expiredIds, revokedIds] = await Promise.all([
    findExpiredRegistrationIds(cutoffDate),
    findRevokedRegistrationIds(cutoffDate)
  ]);

  return new Set([...expiredIds, ...revokedIds]);
};


const cleanupRegistration = async (registrationId) => {
  return database.sequelize.transaction(async (t) => {
    // Use paranoid: false so the update applies to soft deleted rows
    await Registration.update(obfuscatedData, {
      where: {id: registrationId},
      transaction: t,
      paranoid: false
    });

    const notesDeleted = await Note.destroy({where: {RegistrationId: registrationId}, transaction: t});
    const returnsDeleted = await Return.destroy({where: {RegistrationId: registrationId}, transaction: t});

    await Registration.destroy({where: {id: registrationId}, transaction: t});

    return {notesDeleted, returnsDeleted};
  });
};

/**
 * 
 * Gets the ids for both revoked and expired registrations
 * Soft deletes them, their notes, and their returns
 * Updates any PII to dummy data
 * 
 * @returns {Object} Summary of what was processed
 */
const softDeleteExpiredRegistrations = async () => {
  const cutoff = new Date();
  cutoff.setFullYear(fiveYearsAgo.getFullYear() - retentionYears);

  const summary = {
    registrationsProcessed: 0,
    notesDeleted: 0,
    returnsDeleted: 0
  };

  const registrationIds = await collectRegistrationIdsForCleanup(cutoff);

  /* eslint-disable no-await-in-loop */
  for (const id of registrationIds) {
    try {
      const result = await cleanupRegistration(id);
      summary.notesDeleted += result.notesDeleted;
      summary.returnsDeleted += result.returnsDeleted;
      summary.registrationsProcessed++;
    } catch (error) {
      jsonConsoleLogger.error(unErrorJson(error));
    }
  }
  /* eslint-enable no-await-in-loop */

  return summary;
};

export {softDeleteExpiredRegistrations as default};
