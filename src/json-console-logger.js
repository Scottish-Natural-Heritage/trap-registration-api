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

export {jsonConsoleLogger as default};
