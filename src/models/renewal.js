const RenewalModel = (sequelize, DataTypes) => {
  const Renewal = sequelize.define(
    'Renewal',
    {
      RegistrationId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true
      }
    },
    {
      sequelize,
      modelName: 'Renewal',
      timestamps: true,
      paranoid: true
    }
  );

  return Renewal;
};

export {RenewalModel as default};
