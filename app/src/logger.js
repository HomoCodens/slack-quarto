const winston = require('winston');
const logger = winston.createLogger({
    level: process.env.WINSTON_LEVEL || 'info',
    transports: [
        new winston.transports.Console()
    ]
});

module.exports = logger;