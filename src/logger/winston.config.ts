// src/logger/winston.config.ts
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
/**
 * Configuration for Winston logger
 * This configuration sets up the logger to log messages in JSON format with timestamps and error stack traces
 */
export const winstonConfig: winston.LoggerOptions = {
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.ms(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        nestWinstonModuleUtilities.format.nestLike('NestApp', { prettyPrint: true }),
      ),
    }),
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/combined.log',
    }),
  ],
};
