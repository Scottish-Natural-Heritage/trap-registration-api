import winston from 'winston';

const jsonConsoleLogger = winston.createLogger({
  level: 'debug',
  format: winston.format.json(),
  defaultMeta: {service: 'trap-registration-api'},
  transports: [new winston.transports.Console({colorize: true})]
});

jsonConsoleLogger.stream = {
  write: (message) => {
    jsonConsoleLogger.info(message);
  }
};

/**
 * Transform Errors in to plain JSON objects so they can be logged via
 * `JSON.stringify`.
 *
 * @param {Error | any} json Some JSON that might be an error.
 * @returns {any} The untransformed JSON if it was not an error, otherwise a
 * new object with the same keys and values as the Error, but as a plain JSON
 * object.
 */
 const unErrorJson = (json) => {
  if (json instanceof Error) {
    const unError = {};
    for (const key of Object.getOwnPropertyNames(json)) {
      unError[key] = json[key];
    }

    return unError;
  }

  return json;
};

export {jsonConsoleLogger as default, unErrorJson};
