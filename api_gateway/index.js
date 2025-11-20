const express = require('express');
const cors = require('cors');
const axios = require('axios');
const CircuitBreaker = require('opossum');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerConfig = require('./swagger/config');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

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
// require('./swagger/orderEndpoints');

const USERS_SERVICE_URL = 'http://service_users:8000/v1';
const ORDERS_SERVICE_URL = 'http://service_orders:8001/v1';

const circuitOptions = {
    timeout: 5000,
    errorThresholdPercentage: 50,
    resetTimeout: 30000,
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

app.post('/v1/auth/register', async (req, res) => {
    try {
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/auth/register`, {
            method: 'POST',
            data: req.body,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway register error:', error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.post('/v1/auth/login', async (req, res) => {
    try {
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/auth/login`, {
            method: 'POST',
            data: req.body,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway login error:', error.message);
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
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/health`, {
            method: 'GET'
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway users health check error:', error.message);
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
        console.log('[GATEWAY_DEBUG] Headers:', req.headers);
        
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/debug`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        console.log('[GATEWAY_DEBUG] Response from users service:', result.data);
        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway debug error:', error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/users/users', async (req, res) => {
    try {
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/users`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway users list error:', error.message);
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
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/profile`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway profile error:', error.message);
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
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/users/${req.params.userId}`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway get user by ID error:', error.message);
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
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/users/${req.params.userId}`, {
            method: 'PUT',
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway update profile error:', error.message);
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
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/users/users/${req.params.userId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway delete user error:', error.message);
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
        const result = await usersCircuit.fire(`${USERS_SERVICE_URL}/auth/debug-users`, {
            method: 'GET'
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway debug users error:', error.message);
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
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/health`, {
            method: 'GET'
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway orders health check error:', error.message);
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
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/status`, {
            method: 'GET'
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway orders status error:', error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.post('/v1/orders', async (req, res) => {
    try {
        console.log('[GATEWAY] Creating order...');
        
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders`, {
            method: 'POST',
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            }
        });

        console.log('[GATEWAY] Order service response status:', result.status);
        console.log('[GATEWAY] Order service response data:', result.data);

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway create order error:', error.message);
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
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/user`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            },
            params: req.query
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway get user orders error:', error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/all', async (req, res) => {
    try {
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/all`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            },
            params: req.query
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway get all orders error:', error.message);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Internal server error'
            }
        });
    }
});

app.get('/v1/orders/statistics', async (req, res) => {
    try {
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/statistics`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway orders statistics error:', error.message);
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
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
            method: 'GET',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway get order by ID error:', error.message);
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
        console.log('[GATEWAY] Updating order:', req.params.orderId);
        
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}`, {
            method: 'PUT',
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            }
        });

        console.log('[GATEWAY] Update order response status:', result.status);
        console.log('[GATEWAY] Update order response data:', result.data);

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway update order error:', error.message);
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
        console.log('[GATEWAY] Assigning engineer to order:', req.params.orderId);
        
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}/assign`, {
            method: 'PATCH',
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            }
        });

        console.log('[GATEWAY] Assign engineer response status:', result.status);
        console.log('[GATEWAY] Assign engineer response data:', result.data);

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway assign engineer error:', error.message);
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
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}/status`, {
            method: 'PATCH',
            data: req.body,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway update order status error:', error.message);
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
        const result = await ordersCircuit.fire(`${ORDERS_SERVICE_URL}/orders/${req.params.orderId}/cancel`, {
            method: 'PATCH',
            headers: {
                'Authorization': req.headers['authorization']
            }
        });

        if (result.data && result.data.error && result.data.error.code === 'SERVICE_UNAVAILABLE') {
            return res.status(503).json(result.data);
        }

        res.status(result.status).json(result.data);

    } catch (error) {
        console.error('Gateway cancel order error:', error.message);
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
    console.error('Unhandled error:', error);
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