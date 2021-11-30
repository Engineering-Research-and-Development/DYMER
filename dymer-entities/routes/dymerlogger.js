const winston = require('winston');
var debug = winston.createLogger({
    levels: {
        debug: 0
    },
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    transports: [
        new(winston.transports.File)({ filename: './logs/debug.log', level: 'debug' }),
        new(winston.transports.Console)({ level: 'debug' })
    ]
});

var info = winston.createLogger({
    levels: {
        info: 1
    },
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    transports: [
        new(winston.transports.File)({ filename: './logs/info.log', level: 'info' }),
        new(winston.transports.Console)({ level: 'info' })
    ]
});

var warn = winston.createLogger({
    levels: {
        warn: 2
    },
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    transports: [
        new(winston.transports.File)({ filename: './logs/warn.log', level: 'warn' }),
        new(winston.transports.Console)({ level: 'warn' })
    ]
});

var error = winston.createLogger({
    levels: {
        error: 3
    },
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    transports: [
        new(winston.transports.File)({ filename: './logs/error.log', level: 'error' }),
        new(winston.transports.Console)({ level: 'error' })
    ]
});

var exports = {
    debug: function(msg) {
        debug.debug(msg);
    },
    info: function(msg) {
        info.info(msg);
    },
    warn: function(msg) {
        warn.warn(msg);
    },
    error: function(msg) {
        error.error(msg);
    },
    log: function(level, msg) {
        var lvl = exports[level];
        lvl(msg);
    }
};
module.exports = exports;
/*module.exports = winston.createLogger({
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss.SSS'
        }),
        winston.format.printf(info => `${info.level}: ${[info.timestamp]}: ${info.message}`),
    ),
    defaultMeta: { service: 'user-service' },
    transports: [
        //
        // - Write all logs with level `error` and below to `error.log`
        // - Write all logs with level `info` and below to `combined.log`
        //
        new winston.transports.File({ filename: './logs/info.log', level: 'info' }),
        new winston.transports.File({ filename: './logs/war.log', level: 'warn' }),
        new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: './logs/combined.log' }),
    ],
});*/