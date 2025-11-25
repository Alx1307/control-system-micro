const express = require('express');
const cors = require('cors');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./swagger/config');
const requestIdMiddleware = require('./middleware/requestId');
const loggerMiddleware = require('./middleware/logger');
const { 
    generalLimiter, 
    authLimiter, 
    orderCreationLimiter, 
    adminLimiter 
} = require('./middleware/rateLimit');
const {
    securityHeaders,
    httpParamProtection,
    noSqlInjectionProtection,
    xssProtection,
    inputValidation
} = require('./middleware/security');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(httpParamProtection);
app.use(noSqlInjectionProtection);
app.use(xssProtection);

app.use(requestIdMiddleware);
app.use(inputValidation);

app.use(loggerMiddleware);
app.use(generalLimiter);

const swaggerSpec = swaggerJsdoc(swaggerConfig);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  swaggerOptions: {
    defaultModelsExpandDepth: -1
  }
}));

require('./swagger/authEndpoints');
require('./swagger/userEndpoints');
require('./swagger/orderEndpoints');

const USERS_SERVICE_URL = 'http://service_users:8000/v1';
const ORDERS_SERVICE_URL = 'http://service_orders:8001/v1';

const circuitOptions = {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
};

const makeServiceCall = async (circuit, url, options = {}, requestId) => {
    const defaultHeaders = {
        'X-Request-ID': requestId,
        'Content-Type': 'application/json'
    };
    
    return await circuit.fire(url, {
        ...options,
        headers: { ...defaultHeaders, ...options.headers }
    });
};

const usersCircuit = new CircuitBreaker(async (url, options = {}) => {
    try {
        const response = await axios({
            url,
            ...options,
            validateStatus: () => true
        });
        
        return {
            data: response.data,
            status: response.status,
            headers: response.headers
        };
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error('Service unavailable');
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Service timeout');
        }
        throw error;
    }
}, circuitOptions);

const ordersCircuit = new CircuitBreaker(async (url, options = {}) => {
    try {
        const response = await axios({
            url,
            ...options,
            validateStatus: () => true
        });
        
        return {
            data: response.data,
            status: response.status,
            headers: response.headers
        };
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            throw new Error('Service unavailable');
        }
        if (error.code === 'ECONNABORTED') {
            throw new Error('Service timeout');
        }
        throw error;
    }
}, circuitOptions);

usersCircuit.fallback(() => ({ 
    success: false,
    error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Users service temporarily unavailable'
    }
}));

ordersCircuit.fallback(() => ({ 
    success: false,
    error: {
        code: 'SERVICE_UNAVAILABLE', 
        message: 'Orders service temporarily unavailable'
    }
}));

app.post('/v1/auth/register', authLimiter, async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/auth/register`,
            {
                method: 'POST',
                data: req.body
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Register error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.post('/v1/auth/login', authLimiter, async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/auth/login`,
            {
                method: 'POST',
                data: req.body
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Login error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/users/health', async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/users/health`,
            { method: 'GET' },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Users health check error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/users/debug', async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/users/debug`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Debug error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/users/users', adminLimiter, async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/users/users`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Users list error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/users/profile', async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/users/profile`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Profile error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/users/users/:userId', async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/users/users/${req.params.userId}`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Get user by ID error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.put('/v1/users/users/:userId', async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/users/users/${req.params.userId}`,
            {
                method: 'PUT',
                data: req.body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['authorization']
                }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Update profile error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.delete('/v1/users/users/:userId', async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/users/users/${req.params.userId}`,
            {
                method: 'DELETE',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Delete user error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/auth/debug-users', async (req, res) => {
    try {
        const result = await makeServiceCall(
            usersCircuit,
            `${USERS_SERVICE_URL}/auth/debug-users`,
            { method: 'GET' },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Debug users error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/health', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/health`,
            { method: 'GET' },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Orders health check error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/status', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/status`,
            { method: 'GET' },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Orders status error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.post('/v1/orders', orderCreationLimiter, async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders`,
            {
                method: 'POST',
                data: req.body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['authorization']
                }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Create order error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/user', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/user`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] },
                params: req.query
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Get user orders error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/all', adminLimiter, async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/all`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] },
                params: req.query
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Get all orders error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/statistics', adminLimiter, async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/statistics`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Orders statistics error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/:orderId', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`,
            {
                method: 'GET',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Get order by ID error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.put('/v1/orders/:orderId', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`,
            {
                method: 'PUT',
                data: req.body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['authorization']
                }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Update order error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.patch('/v1/orders/:orderId/assign', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/${req.params.orderId}/assign`,
            {
                method: 'PATCH',
                data: req.body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['authorization']
                }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Assign engineer error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.patch('/v1/orders/:orderId/status', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/${req.params.orderId}/status`,
            {
                method: 'PATCH',
                data: req.body,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': req.headers['authorization']
                }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Update order status error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.patch('/v1/orders/:orderId/cancel', async (req, res) => {
    try {
        const result = await makeServiceCall(
            ordersCircuit,
            `${ORDERS_SERVICE_URL}/orders/${req.params.orderId}/cancel`,
            {
                method: 'PATCH',
                headers: { 'Authorization': req.headers['authorization'] }
            },
            req.requestId
        );

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error(`[GATEWAY][${req.requestId}] Cancel order error:`, error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/health', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'API Gateway is running',
            timestamp: new Date().toISOString(),
            circuits: {
                users: {
                    status: usersCircuit.status,
                    stats: usersCircuit.stats
                },
                orders: {
                    status: ordersCircuit.status,
                    stats: ordersCircuit.stats
                }
            }
        }
    });
});

app.get('/status', (req, res) => {
    res.json({
        success: true,
        data: {
            status: 'API Gateway is running',
            service: 'api_gateway',
            timestamp: new Date().toISOString()
        }
    });
});

app.use((error, req, res, next) => {
    console.error(`[GATEWAY][${req.requestId}] Unhandled error:`, error);
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Internal server error'
        }
    });
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: 'NOT_FOUND',
            message: 'Route not found'
        }
    });
});

app.listen(PORT, () => {
    console.log(`API Gateway running on port ${PORT}`);
    console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});