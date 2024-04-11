const RequestUUIDModel = (sequelize, DataTypes) => {
  const RequestUUID = sequelize.define(
    'RequestUUID',
    {
      uuid: {
        type: UUID,
        allowNull: false,
        primaryKey: true
      }
    },
    {
      sequelize,
      modelName: 'RequestUUID',
      timestamps: true,
      paranoid: true,
      freezeTableName: true
    }
  );

  return RequestUUID;
};

export {RequestUUIDModel as default};
