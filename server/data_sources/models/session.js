const Sequelize = require("sequelize");

/**
 * Defines the Session model
 */
class Session extends Sequelize.Model {}

module.exports = sequelize => {
  Session.init(
    {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "User",
          key: "id"
        }
      },
      createdAt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: Sequelize.literal("EXTRACT(EPOCH from now())"),
      },
      updatedAt: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: Sequelize.literal("EXTRACT(EPOCH from now())"),
        onUpdate: "SET DEFAULT",
      },
    },
    {
      tableName: "sessions",
      sequelize,
    },
  );

  return Session;
};
