'use strict';

import Sequelize from 'sequelize';

const {Model} = Sequelize;

const NonTargetSpeciesModel = (sequelize) => {
  class NonTargetSpecies extends Model {}

  NonTargetSpecies.init(
    {
      ReturnId: {
        type: Sequelize.INTEGER,
        validate: {
          notEmpty: true
        }
      },
      gridReference: {
        type: Sequelize.STRING,
        validate: {
          notEmpty: true
        }
      },
      speciesCaught: {
        type: Sequelize.STRING,
        validate: {
          notEmpty: true
        }
      },
      numberCaught: {
        type: Sequelize.INTEGER,
        validate: {
          notEmpty: true
        }
      },
      trapType: {
        type: Sequelize.STRING,
        validate: {
          notEmpty: true
        }
      },
      comment: {
        type: Sequelize.TEXT
      }
    },
    {
      sequelize,
      modelName: 'NonTargetSpecies',
      timestamps: true,
      paranoid: true
    }
  );

  return NonTargetSpecies;
};

export {NonTargetSpeciesModel as default};
