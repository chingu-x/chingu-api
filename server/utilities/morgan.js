const morgan = require("morgan");
const logger = require("./logger");

module.exports = () =>
  morgan("tiny", {
    stream: logger.stream,
    skip: req => req.originalUrl === "/.well-known/apollo/server-health",
  });
