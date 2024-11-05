const RegistrationNumberModel = (sequelize, DataTypes) => {
  const RegistrationNumber = sequelize.define(
    'RegistrationNumber',
    {
      RegistrationNumber: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      },
      RegistrationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      }
    },
    {
      sequelize,
      modelName: 'RegistrationNumber',
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    }
  );

  return RegistrationNumber;
};

export {RegistrationNumberModel as default};
