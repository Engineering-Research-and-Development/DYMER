const winston = require('winston');
const fs = require('fs')
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
        new(winston.transports.File)({ filename: './logs/debug.log', level: 'debug' })
    ]
});
/*transports: [
    new (winston.transports.File)({ filename: './logs/debug.log', level: 'debug' }),
    new (winston.transports.Console)({ level: 'debug' })
]*/
let infoLog = [
    new(winston.transports.File)({ filename: './logs/info.log', level: 'info' })
];

let loggerdebug = (process.env.DYMER_LOGGER == undefined) ? false : process.env.DYMER_LOGGER;
global.loggerdebug = loggerdebug;
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
    transports: infoLog
});

/*
 transports: [
        new(winston.transports.File)({ filename: './logs/info.log', level: 'info' }),
        new(winston.transports.Console)({ level: 'info' })
    ]
*/
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
        new(winston.transports.File)({ filename: './logs/warn.log', level: 'warn' })
    ]
});

/*transports: [
    new (winston.transports.File)({ filename: './logs/warn.log', level: 'warn' }),
    new (winston.transports.Console)({ level: 'warn' })
]*/
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
        new(winston.transports.File)({ filename: './logs/error.log', level: 'error' })
    ]
});

/*
   transports: [
        new(winston.transports.File)({ filename: './logs/error.log', level: 'error' }),
        new(winston.transports.Console)({ level: 'error' })
    ]
*/
console.log('loggerdebug', loggerdebug);
const consolelog = new winston.transports.Console({ level: 'info' });
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
    },
    ts_infologger: function(logconsole) {
        if (global.loggerdebug != logconsole) {
            global.loggerdebug = logconsole;
            if (logconsole) {
                info.add(consolelog);
            } else {
                info.remove(consolelog);
            }
        }
    }
};
if (loggerdebug != undefined && (loggerdebug == 'true' || loggerdebug == true)) {
    exports.ts_infologger(loggerdebug)
}

exports.setlogconsole = function(typefile) {
    let typefilepath = './logs/' + typefile + '.log';
    let fsize = (fs.statSync(typefilepath)).size;
    fsize = (fsize > 0) ? (fsize / (1024 * 1024)).toFixed(2) : fsize;
    return fsize + " M";
};

exports.filesize = function(typefile) {
    let typefilepath = './logs/' + typefile + '.log';
    let fsize = (fs.statSync(typefilepath)).size;
    fsize = (fsize > 0) ? (fsize / (1024 * 1024)).toFixed(2) : fsize;
    return fsize + " M";
};

exports.flushfile = function(typefile) {
    let typefilepath = './logs/' + typefile + '.log';
    fs.writeFile(typefilepath, '', function() { console.log('flushed ' + typefilepath) })
};

exports.flushAllfile = function() {
    let typefilepath1 = './logs/info.log';
    fs.writeFile(typefilepath1, '', function(typefilepath) { console.log('flushed' + typefilepath1) })
    let typefilepath2 = './logs/error.log';
    fs.writeFile(typefilepath2, '', function(typefilepath) { console.log('flushed ' + typefilepath2) })
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