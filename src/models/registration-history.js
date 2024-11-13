import utils from 'naturescot-utils';
import {UUID, UUIDV4} from 'sequelize';

const RegistrationHistoryModel = (sequelize, DataTypes) => {
  const RegistrationHistory = sequelize.define(
    'RegistrationHistory',
    {
      revisionId: {
        type: UUID,
        defaultValue: UUIDV4,
        allowNull: false,
        primaryKey: true
      },
      RegistrationId: {
        type: DataTypes.INTEGER,
        references: {
          model: 'Registrations',
          key: 'id'
        }
      },
      convictions: {
        type: DataTypes.BOOLEAN
      },
      usingGL01: {
        type: DataTypes.BOOLEAN
      },
      usingGL02: {
        type: DataTypes.BOOLEAN
      },
      usingGL03: {
        type: DataTypes.BOOLEAN
      },
      complyWithTerms: {
        type: DataTypes.BOOLEAN
      },
      meatBaits: {
        type: DataTypes.BOOLEAN
      },
      fullName: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      addressLine1: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      addressLine2: {
        type: DataTypes.STRING
      },
      addressTown: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      addressCounty: {
        type: DataTypes.STRING
      },

      addressPostcode: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      phoneNumber: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true
        }
      },
      emailAddress: {
        type: DataTypes.STRING,
        validate: {
          notEmpty: true,
          isValidEmail(value) {
            try {
              utils.recipients.validateEmailAddress(value);
              return true;
            } catch {
              return false;
            }
          }
        }
      },
      createdByLicensingOfficer: {
        type: DataTypes.STRING
      },

      expiryDate: {
        type: DataTypes.DATE
      },
      uprn: {
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'RegistrationHistory',
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    }
  );

  return RegistrationHistory;
};

export {RegistrationHistoryModel as default};
