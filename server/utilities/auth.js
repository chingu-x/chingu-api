const fs = require("fs");

const { PRIVATE_KEY_PATH, PUBLIC_KEY_PATH, NODE_ENV = "development" } = process.env;

const SALT_ROUNDS = 12;
const TOKEN_ISSUER = "api.tibu.nu";
const TOKEN_AUDIENCE = "api.tibu.nu";

const FAKE_KEY = "THISISNOTANACTUALPRIVATEKEY";

const privateKey = new Promise((resolve) => {
  if(NODE_ENV === "development") {
    resolve(FAKE_KEY);
  }

  fs.readFile(PRIVATE_KEY_PATH, (err, data) => {
    if(err) {
      logger.error(err);
      process.exit(1);
    }
    return resolve(data);
  })
});
const getPrivateKey = () => privateKey;

const publicKey = new Promise((resolve) => {
  if(NODE_ENV === "development") {
    resolve(FAKE_KEY);
  }

  fs.readFileSync(PUBLIC_KEY_PATH, (err, data) => {
    if(err) {
      logger.error(err);
      process.exit(1);
    }
    return resolve(data);
  });
});
const getPublicKey = () => publicKey;

module.exports = {
  SALT_ROUNDS,
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
  getPrivateKey,
  getPublicKey
};