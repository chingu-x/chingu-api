const { createLogger, format, transports } = require("winston");

const { LOG_LEVEL = "info", DISABLE_LOGGING = false } = process.env;

/**
 * Determines whether or not to ignore a specific error
 * @param {Object} err - The error being evaluated
 * @param {string} err.code - The error code
 * @return {boolean} Whether or not the error should be ignored
 */
function ignoreCertainErrors(err) {
  const errorsToIgnore = [];

  return !errorsToIgnore.includes(err.code);
}

/**
 * Correctly enumerates Error objects
 */
const enumerateErrorFormat = format(info => {
  if (info.message instanceof Error) {
    info.message = Object.assign(
      {
        message: info.message.message,
        stack: info.message.stack,
      },
      info.message,
    );
  }

  if (info instanceof Error) {
    return Object.assign(
      {
        message: info.message,
        stack: info.stack,
      },
      info,
    );
  }

  return info;
});

// Define the default logger
const logger = createLogger({
  level: LOG_LEVEL,
  format: format.combine(enumerateErrorFormat(), format.json()),
  transports: [
    new transports.Console({
      handleExceptions: true,
      colorize: true,
    }),
  ],
  exitOnError: ignoreCertainErrors,
  silent: DISABLE_LOGGING,
});

// Define the stream that will be used by the morgan request logger
logger.stream = {
  write: function(message) {
    logger.info(message);
  },
};

module.exports = logger;
