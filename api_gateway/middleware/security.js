const helmet = require('helmet');
const hpp = require('hpp');

const securityHeaders = helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    crossOriginEmbedderPolicy: false
});

const httpParamProtection = hpp();

const noSqlInjectionProtection = (req, res, next) => {
    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (key.startsWith('$')) {
                console.warn(`[SECURITY] Blocked NoSQL operator: ${key}`);
                continue;
            }
            
            if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    if (req.query) {
        req.sanitizedQuery = sanitizeObject(req.query);
    }
    if (req.body) {
        req.sanitizedBody = sanitizeObject(req.body);
    }
    
    next();
};

const xssProtection = (req, res, next) => {
    const sanitizeString = (str) => {
        if (typeof str !== 'string') return str;
        
        return str
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    };

    const sanitizeObject = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === 'string') {
                sanitized[key] = sanitizeString(value);
            } else if (typeof value === 'object' && value !== null) {
                sanitized[key] = sanitizeObject(value);
            } else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };

    if (req.query) {
        req.sanitizedQuery = sanitizeObject(req.query);
    }
    if (req.body) {
        req.sanitizedBody = sanitizeObject(req.body);
    }
    
    next();
};

const inputValidation = (req, res, next) => {
    if (req.headers['content-length'] > 1000000) {
        return res.status(413).json({
            success: false,
            error: {
                code: 'PAYLOAD_TOO_LARGE',
                message: 'Слишком большой размер запроса'
            }
        });
    }
    
    if (req.method === 'POST' || req.method === 'PUT') {
        try {
            if (req.body && typeof req.body === 'object') {
                const jsonString = JSON.stringify(req.body);
                if (jsonString.length > 50000) {
                    return res.status(400).json({
                        success: false,
                        error: {
                            code: 'REQUEST_TOO_LARGE', 
                            message: 'Слишком большой объем данных'
                        }
                    });
                }
            }
        } catch (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_JSON',
                    message: 'Некорректный JSON'
                }
            });
        }
    }
    
    next();
};

module.exports = {
    securityHeaders,
    httpParamProtection, 
    noSqlInjectionProtection,
    xssProtection,
    inputValidation
};