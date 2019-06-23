const {
  SECRET_KEY = "THISISNOTANACTUALPRIVATEKEY"
} = process.env;

const SALT_ROUNDS = 12;
const TOKEN_ISSUER = "api.tibu.nu";
const TOKEN_AUDIENCE = "api.tibu.nu";

module.exports = {
  SALT_ROUNDS,
  TOKEN_AUDIENCE,
  TOKEN_ISSUER,
  SECRET_KEY
};