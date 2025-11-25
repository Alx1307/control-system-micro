class Logger {
    static info(message, requestId = '') {
        console.log(`[USERS][${requestId}] ${message}`);
    }

    static error(message, requestId = '') {
        console.error(`[USERS][${requestId}] ERROR: ${message}`);
    }

    static warn(message, requestId = '') {
        console.warn(`[USERS][${requestId}] WARN: ${message}`);
    }

    static debug(message, requestId = '') {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[USERS][${requestId}] DEBUG: ${message}`);
        }
    }
}

module.exports = Logger;