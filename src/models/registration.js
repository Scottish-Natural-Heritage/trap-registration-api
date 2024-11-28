import utils from 'naturescot-utils';

const RegistrationModel = (sequelize, DataTypes) => {
  const Registration = sequelize.define(
    'Registration',
    {
      trapId: {
        type: DataTypes.INTEGER
      },
      registrationType: {
        type: DataTypes.STRING
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
        type: DataTypes.DATE,
        allowNull: true
      },
      uprn: {
        type: DataTypes.STRING
      }
    },
    {
      timestamps: true,
      paranoid: true
    }
  );
  return Registration;
};

export {RegistrationModel as default};
