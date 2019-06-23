const Sequelize = require("sequelize");
const logger = require("../utilities/logger");
const { initializeModels } = require("./models");

const {
  DB_HOST: host = "localhost",
  DB_USERNAME: username = "postgres",
  DB_PASSWORD: password,
  DB_NAME: database = "chingu",
} = process.env;

let sequelize;

/**
 * Initializes a database client
 * @return {Object} The database client
 */
function initializeDatabase() {
  sequelize = new Sequelize({
    host,
    username,
    password,
    database,
    dialect: "postgres",
    define: {
      timestamps: false,
      freezeTableName: true,
      underscored: true
    },
    logging: (...log) => logger.debug(log)
  });

  return sequelize
    .authenticate()
    .then(() => initializeModels(sequelize))
    .catch(err => {
      logger.error(err);
      process.exit(1);
    });
}

/**
 * Initializes data sources
 * @return {Object} Datasources
 */
function initializeDataSources() {
  return {
    models: sequelize.models
  };
}

module.exports = { initializeDatabase, initializeDataSources };