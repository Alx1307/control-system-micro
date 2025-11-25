class Logger {
    static info(message, requestId = '') {
        console.log(`[ORDERS][${requestId}] ${message}`);
    }

    static error(message, requestId = '') {
        console.error(`[ORDERS][${requestId}] ERROR: ${message}`);
    }

    static warn(message, requestId = '') {
        console.warn(`[ORDERS][${requestId}] WARN: ${message}`);
    }

    static debug(message, requestId = '') {
        if (process.env.NODE_ENV === 'development') {
            console.log(`[ORDERS][${requestId}] DEBUG: ${message}`);
        }
    }
}

module.exports = Logger;