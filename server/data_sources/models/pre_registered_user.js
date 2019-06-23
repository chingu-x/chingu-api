const Sequelize = require("sequelize");

/**
 * Defines the PreRegisteredUser model
 */
class PreRegisteredUser extends Sequelize.Model {}

module.exports = sequelize => {
  PreRegisteredUser.init(
    {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: Sequelize.literal("EXTRACT(EPOCH from now())"),
      },
      updated_at: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: Sequelize.literal("EXTRACT(EPOCH from now())"),
        onUpdate: "SET DEFAULT",
      },
    },
    {
      tableName: "pre_registered_users",
      sequelize,
    },
  );

  return PreRegisteredUser;
};
