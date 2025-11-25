const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Слишком много запросов, попробуйте позже'
        }
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        console.log(`[GATEWAY][${req.requestId}] Rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: {
                code: 'RATE_LIMIT_EXCEEDED',
                message: 'Слишком много запросов, попробуйте позже'
            }
        });
    }
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        error: {
            code: 'AUTH_RATE_LIMIT_EXCEEDED',
            message: 'Слишком много попыток входа, попробуйте позже'
        }
    },
    handler: (req, res) => {
        console.log(`[GATEWAY][${req.requestId}] Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            success: false,
            error: {
                code: 'AUTH_RATE_LIMIT_EXCEEDED',
                message: 'Слишком много попыток входа, попробуйте позже'
            }
        });
    }
});

const orderCreationLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: {
        success: false,
        error: {
            code: 'ORDER_CREATION_LIMIT_EXCEEDED',
            message: 'Слишком много заказов, попробуйте позже'
        }
    },
    handler: (req, res) => {
        console.log(`[GATEWAY][${req.requestId}] Order creation limit exceeded for user: ${req.user?.userId || 'unknown'}`);
        res.status(429).json({
            success: false,
            error: {
                code: 'ORDER_CREATION_LIMIT_EXCEEDED',
                message: 'Слишком много заказов, попробуйте позже'
            }
        });
    }
});

const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    message: {
        success: false,
        error: {
            code: 'ADMIN_RATE_LIMIT_EXCEEDED',
            message: 'Превышен лимит административных операций'
        }
    }
});

module.exports = {
    generalLimiter,
    authLimiter,
    orderCreationLimiter,
    adminLimiter
};