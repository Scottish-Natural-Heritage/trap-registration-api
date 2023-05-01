const NoteModel = (sequelize, DataTypes) => {
  const Note = sequelize.define(
    'Note',
    {
      Note: {
        type: DataTypes.TEXT
      },
      createdBy: {
        type: DataTypes.STRING
      }
    },
    {
      sequelize,
      modelName: 'Note',
      timestamps: true,
      paranoid: true
    }
  );

  return Note;
};

export {NoteModel as default};
