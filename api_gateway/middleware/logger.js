const logger = (req, res, next) => {
    const start = Date.now();
    
    console.log(`[GATEWAY][${req.requestId}] ${req.method} ${req.path} | User: ${req.user?.userId || 'anonymous'} | IP: ${req.ip}`);
    
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[GATEWAY][${req.requestId}] ${req.method} ${req.path} | Status: ${res.statusCode} | Duration: ${duration}ms`);
    });
    
    next();
};

module.exports = logger;