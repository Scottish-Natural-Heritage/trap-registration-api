import Sequelize from 'sequelize';

const {Model} = Sequelize;

/**
 * Build an Revocation model.
 *
 * @param {Sequelize.Sequelize} sequelize A Sequelize connection.
 * @returns {Sequelize.Model} An Revocation model.
 */
const RevocationModel = (sequelize) => {
  class Revocation extends Model {}

  Revocation.init(
    {
      RegistrationId: {
        type: Sequelize.INTEGER,
        validate: {
          notEmpty: true
        }
      },
      createdBy: {
        type: Sequelize.STRING
      },
      isRevoked: {
        type: Sequelize.BOOLEAN
      },
      reason: {
        type: Sequelize.STRING
      }
    },
    {
      sequelize,
      modelName: 'Revocation',
      timestamps: true,
      paranoid: true
    }
  );

  return Revocation;
};

export {RevocationModel as default};
