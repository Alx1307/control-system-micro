const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    console.log('[AUTH_MIDDLEWARE] Headers:', req.headers);
    
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('[AUTH_MIDDLEWARE] No token found');
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Не выполнена авторизация. Отсутствует токен.'
            }
        });
    }

    const token = authHeader.split(' ')[1];
    console.log('[AUTH_MIDDLEWARE] Token:', token ? 'PRESENT' : 'MISSING');

    if (!token) {
        console.log('[AUTH_MIDDLEWARE] Invalid token format');
        return res.status(401).json({
            success: false,
            error: {
                code: 'UNAUTHORIZED',
                message: 'Не выполнена авторизация. Некорректный формат токена.'
            }
        });
    }

    try {
        console.log('[AUTH_MIDDLEWARE] JWT Secret:', process.env.JWT_SECRET_KEY ? 'SET' : 'NOT SET');
        
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY || 'fallback-secret', {
            algorithms: ['HS256']
        });

        console.log('[AUTH_MIDDLEWARE] Decoded token:', decodedToken);
        
        req.user = {
            userId: decodedToken.userId || decodedToken.id,
            email: decodedToken.email,
            roles: Array.isArray(decodedToken.roles) ? decodedToken.roles : 
                  (decodedToken.role ? [decodedToken.role] : ['viewer'])
        };

        console.log('[AUTH_MIDDLEWARE] Normalized user:', req.user);
        
        next();
    } catch (err) {
        console.error('[AUTH_MIDDLEWARE] JWT verification error:', err.message);
        
        let errorCode = 'UNAUTHORIZED';
        let message = 'Некорректный токен.';
        
        if (err.name === 'TokenExpiredError') {
            errorCode = 'TOKEN_EXPIRED';
            message = 'Срок действия токена истек.';
        } else if (err.name === 'JsonWebTokenError') {
            errorCode = 'INVALID_TOKEN';
            message = 'Недействительный токен.';
        } else if (err.name === 'NotBeforeError') {
            errorCode = 'TOKEN_NOT_ACTIVE';
            message = 'Токен еще не действует.';
        }

        return res.status(401).json({
            success: false,
            error: {
                code: errorCode,
                message: message,
                details: err.message
            }
        });
    }
};

module.exports = authMiddleware;