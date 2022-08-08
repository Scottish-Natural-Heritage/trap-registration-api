import Sequelize from 'sequelize';

const {Model} = Sequelize;

/**
 * Build an Return model.
 *
 * @param {Sequelize.Sequelize} sequelize A Sequelize connection.
 * @returns {Sequelize.Model} An Return model.
 */
const ReturnModel = (sequelize) => {
  class Return extends Model {}

  Return.init(
    {
      RegistrationId: {
        type: Sequelize.INTEGER,
        validate: {
          notEmpty: true
        }
      },
      nonTargetSpeciesToReport: {
        type: Sequelize.BOOLEAN
      },
      createdByLicensingOfficer: {
        type: Sequelize.STRING
      },
      year: {
        type: Sequelize.STRING
      },
      numberLarsenMate: {
        type: Sequelize.INTEGER
      },
      numberLarsenPod: {
        type: Sequelize.INTEGER
      },
      noMeatBaitsUsed: {
        type: Sequelize.BOOLEAN
      }
    },
    {
      sequelize,
      modelName: 'Return',
      timestamps: true,
      paranoid: true
    }
  );

  return Return;
};

export {ReturnModel as default};
