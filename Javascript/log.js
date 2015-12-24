var winston = require('winston');

var logger;

if (process.env.NODE_ENV !== 'test') {
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'test/test.log' })
        ]
    });
} else {
	// console.log('Only showing logs from failed tests [log.js]');
    // while testing, log only to file, leaving stdout free for unit test status messages
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: 'test/test.log' })
        ]
    });
}

module.exports = function(msg) {
	logger.info(msg);
	// logger.log(msg);
};