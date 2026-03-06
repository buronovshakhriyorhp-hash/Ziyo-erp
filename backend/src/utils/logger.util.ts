import winston from 'winston';
import { ENV } from '../config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Log formati
const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
    return `${ts} [${level}]: ${stack || message}`;
});

export const logger = winston.createLogger({
    level: ENV.IS_PRODUCTION ? 'warn' : 'debug',
    format: combine(
        errors({ stack: true }),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        ENV.IS_PRODUCTION ? winston.format.json() : combine(colorize(), logFormat)
    ),
    transports: [
        new winston.transports.Console(),
        // Production'da fayl loglariga ham yozish
        ...(ENV.IS_PRODUCTION
            ? [
                new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
                new winston.transports.File({ filename: 'logs/combined.log' }),
            ]
            : []),
    ],
});
