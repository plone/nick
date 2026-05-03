/**
 * Log.
 * @module log
 */

// External imports
import logger from 'log4js';

// Configure logs
logger.configure({
  appenders: {
    error_stdout: {
      type: 'stdout',
      layout: { type: 'pattern', pattern: '%[%d %p%] [%f{1}:%l] %m' },
    },
    error_file: {
      type: 'file',
      filename: 'var/log/error.log',
      layout: { type: 'pattern', pattern: '%d %p [%f{1}:%l] %m' },
    },
    access_file: {
      type: 'file',
      filename: 'var/log/access.log',
      layout: { type: 'pattern', pattern: '%m' },
    },
  },
  categories: {
    default: {
      appenders: ['error_stdout', 'error_file'],
      level: 'info',
      enableCallStack: true,
    },
    access: {
      appenders: ['access_file'],
      level: 'info',
      enableCallStack: true,
    },
  },
});

// Create error logger
const log = logger.getLogger();

export { logger, log };
