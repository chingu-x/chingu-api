const fs = require("fs");
const path = require("path");
const logger = require("../../utilities/logger");

const initializeModels = sequelize => new Promise((resolve, reject) => {
  fs.readdir(__dirname, (err, files) => {
    if (err) {
      logger.error(err);
      reject(err);
    }

    files
      .filter(
        modelFile =>
          modelFile &&
          modelFile.includes(".js") &&
          path.join(__dirname, modelFile) !== __filename,
      )
      .forEach(modelFile => {
        sequelize.import(path.join(__dirname, modelFile));
      });

    resolve(sequelize);
  });
});

module.exports = { initializeModels };
