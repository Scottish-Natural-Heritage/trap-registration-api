'use strict';
const RegistrationModel = (sequelize, DataTypes) => {
  const Registration = sequelize.define(
    'Registration',
    {
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
          isEmail: true
        }
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
