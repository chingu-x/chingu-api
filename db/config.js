const logger = require("../server/utilities/logger");

const {
  DB_HOST: host = "localhost",
  DB_PORT: port = "5432",
  DB_USERNAME: username = "postgres",
  DB_PASSWORD: password,
  DB_NAME: database = "chingu",
} = process.env;

const config = {
  host,
  port,
  username,
  password,
  database,
  dialect: "postgres",
  define: {
    timestamps: false,
    underscored: true,
  },
  logging: (...log) => logger.debug(log),
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
