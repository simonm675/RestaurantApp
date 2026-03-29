const winston = require("winston");
const path = require("path");

const logDir = path.join(process.cwd(), "logs");

// Custom format für Logs
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) log += `\n${stack}`;
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: customFormat,
  defaultMeta: { service: "restaurant-api" },
  transports: [
    // Console output (alle Levels)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, stack }) => {
          let output = `${timestamp} ${level}: ${message}`;
          if (stack) output += `\n${stack}`;
          return output;
        })
      ),
    }),
    // Error log (nur errors)
    new winston.transports.File({
      filename: path.join(logDir, "error.log"),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Combined log (alle)
    new winston.transports.File({
      filename: path.join(logDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

// HTTP-Request Logging (Integration mit Morgan)
logger.httpStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

module.exports = logger;
