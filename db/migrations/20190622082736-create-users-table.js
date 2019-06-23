module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("users", {
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
      password: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: "USER",
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
    return queryInterface.dropTable("users");
  },
};
