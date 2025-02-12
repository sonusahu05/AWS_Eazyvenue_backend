const appRoot = require('app-root-path');
const config = require('config');
const fs = require('fs');
const winston = require('winston');
const { createLogger, format, transports } = require('winston');

const errorFileLogger = config.get('errorLogger.file');
const consoleLogger = config.get('errorLogger.console');
const fileErrorlogDir = `${appRoot}/${errorFileLogger.logDir}`;
const errorLogFileUrl = `${fileErrorlogDir}/${errorFileLogger.logFile}`;

const fileLogger = config.get('logger.file');
const fileConsoleLogger = config.get('logger.console');
const fileConsolelogDir = `${appRoot}/${fileLogger.logDir}`;
const fileConsoleErrorLogFileUrl = `${fileConsolelogDir}/${fileLogger.logFile}`;
winston.addColors(winston.config.npm.colors);
if (!fs.existsSync(fileErrorlogDir)) {
    fs.mkdirSync(fileErrorlogDir);
}
if (!fs.existsSync(fileConsolelogDir)) {
    fs.mkdirSync(fileConsolelogDir);
}

const logger = {
    infoLog: winston.createLogger({
        level: 'info',
        format: winston.format.json(),
        //transports: [new winston.transports.File({ filename: fileConsoleErrorLogFileUrl})],
        transports: [
            new winston.transports.File({
                filename: fileConsoleErrorLogFileUrl,
                handleExceptions: true,
                json: true,
                maxsize: fileLogger.maxsize,
                maxFiles: fileLogger.maxFiles,
                //colorize: false,
                //timestamp: () => (new Date()).toLocaleString('en-US', { hour12: false }),
                
                format:format.combine(
                    format.label(`Label🏷️`),
                    format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
                    format.align(),
                    format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
                )
            })
        ]
    }),
  
    errorLog: winston.createLogger({
        level: 'error',
        format: winston.format.simple(),
        transports: [
            new winston.transports.File({
                filename: errorLogFileUrl,
                handleExceptions: true,
                json: true,
                maxsize: errorFileLogger.maxsize,
                maxFiles: errorFileLogger.maxFiles,
                //colorize: false,
                //timestamp: () => (new Date()).toLocaleString('en-US', { hour12: false }),
                
                format:format.combine(
                    format.label(`Label🏷️`),
                    format.timestamp({format: 'MMM-DD-YYYY HH:mm:ss'}),
                    format.align(),
                    format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
                )
            })
        ]
    })
  };
module.exports = logger;