const schemas = require('./schemas');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Микросервисная система ControlSystem',
      version: '1.0.0',
      description: 'Документация API для микросервисной системы управления пользователями и заказами'
    },
    servers: [
      {
        url: 'http://localhost:8000',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: schemas
    }
  },
  apis: [
    './index.js',
    './swagger/*.js'
  ],
};

module.exports = swaggerOptions;