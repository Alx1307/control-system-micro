const Logger = require('../utils/logger');

const requestLogger = (req, res, next) => {
    const start = Date.now();
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    Logger.info(`${req.method} ${req.path} | User: ${req.user?.userId || 'anonymous'}`, requestId);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        Logger.info(`${req.method} ${req.path} | Status: ${res.statusCode} | Duration: ${duration}ms`, requestId);
    });
    
    next();
};

module.exports = requestLogger;