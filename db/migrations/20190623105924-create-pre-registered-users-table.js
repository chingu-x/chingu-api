module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("pre_registered_users", {
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
    });
  },

  down: queryInterface => {
    return queryInterface.dropTable("pre_registered_users");
  },
};
