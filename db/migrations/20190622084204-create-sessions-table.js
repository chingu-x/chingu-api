module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.createTable("sessions", {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
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
    return queryInterface.dropTable("sessions");
  },
};
