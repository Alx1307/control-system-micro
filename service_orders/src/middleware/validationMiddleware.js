const Joi = require('joi');

const orderItemSchema = Joi.object({
    product: Joi.string().min(1).max(255).required()
        .messages({
            'string.empty': 'Наименование товара обязательно',
            'any.required': 'Наименование товара обязательно'
        }),
    quantity: Joi.number().integer().min(1).max(1000).required()
        .messages({
            'number.base': 'Количество должно быть числом',
            'number.min': 'Количество должно быть не менее 1',
            'number.max': 'Количество не должно превышать 1000',
            'any.required': 'Количество обязательно'
        }),
    price: Joi.number().precision(2).min(0.01).max(1000000).required()
        .messages({
            'number.base': 'Цена должна быть числом',
            'number.min': 'Цена должна быть не менее 0.01',
            'number.max': 'Цена не должна превышать 1,000,000',
            'any.required': 'Цена обязательна'
        })
});

const createOrderSchema = Joi.object({
    items: Joi.array().items(orderItemSchema).min(1).max(50).required()
        .messages({
            'array.min': 'Заказ должен содержать хотя бы один товар',
            'array.max': 'Заказ не может содержать более 50 товаров',
            'any.required': 'Список товаров обязателен'
        }),
    assignedEngineerId: Joi.string().min(1).optional()
        .messages({
            'string.empty': 'ID инженера не может быть пустым'
        })
});

const updateOrderStatusSchema = Joi.object({
    status: Joi.string().valid('created', 'in_progress', 'under_review', 'completed').required()
        .messages({
            'any.only': 'Статус должен быть одним из: created, in_progress, under_review, completed',
            'any.required': 'Статус обязателен'
        })
});

const assignEngineerSchema = Joi.object({
    engineerId: Joi.string().min(1).required()
        .messages({
            'string.empty': 'ID инженера обязателен',
            'any.required': 'ID инженера обязателен'
        })
});

const updateOrderSchema = Joi.object({
    items: Joi.array().items(orderItemSchema).min(1).max(50).optional()
        .messages({
            'array.min': 'Заказ должен содержать хотя бы один товар',
            'array.max': 'Заказ не может содержать более 50 товаров'
        }),
    assignedEngineerId: Joi.string().min(1).optional()
        .messages({
            'string.empty': 'ID инженера не может быть пустым'
        })
}).min(1)
.messages({
    'object.min': 'Не указаны поля для обновления'
});

const orderIdSchema = Joi.object({
    orderId: Joi.string().min(1).required()
        .messages({
            'string.empty': 'ID заказа обязателен',
            'any.required': 'ID заказа обязателен'
        })
});

const getOrdersSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1)
        .messages({
            'number.base': 'Параметр page должен быть числом',
            'number.min': 'Параметр page должен быть положительным числом'
        }),
    limit: Joi.number().integer().min(1).max(100).default(10)
        .messages({
            'number.base': 'Параметр limit должен быть числом',
            'number.min': 'Параметр limit должен быть не менее 1',
            'number.max': 'Параметр limit не должен превышать 100'
        }),
    status: Joi.string().valid('created', 'in_progress', 'under_review', 'completed', 'cancelled').optional()
        .messages({
            'any.only': 'Статус должен быть одним из: created, in_progress, under_review, completed, cancelled'
        }),
    userId: Joi.string().optional()
        .messages({
            'string.empty': 'ID пользователя не может быть пустым'
        }),
    engineerId: Joi.string().optional()
        .messages({
            'string.empty': 'ID инженера не может быть пустым'
        }),
    sortBy: Joi.string().valid('createdAt', 'updatedAt', 'totalAmount').default('createdAt')
        .messages({
            'any.only': 'Сортировка должна быть по: createdAt, updatedAt, totalAmount'
        }),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
        .messages({
            'any.only': 'Порядок сортировки должен быть: asc или desc'
        })
});

const validate = (schema, source = 'body') => {
    return (req, res, next) => {
        const dataToValidate = source === 'body' ? req.body : 
                              source === 'params' ? req.params : req.query;
        
        const { error } = schema.validate(dataToValidate, {
            abortEarly: false
        });

        if (error) {
            console.log(`[ORDER_VALIDATION_ERROR] ${source}:`, error.details);
            console.log(`[ORDER_VALIDATION_ERROR] Данные:`, dataToValidate);
            
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return res.error('VALIDATION_ERROR', errorMessage, 400);
        }
        
        next();
    };
};

const validateBody = (schema) => validate(schema, 'body');
const validateQuery = (schema) => validate(schema, 'query');
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
    validateCreateOrder: validateBody(createOrderSchema),
    validateUpdateOrderStatus: validateBody(updateOrderStatusSchema),
    validateAssignEngineer: validateBody(assignEngineerSchema),
    validateUpdateOrder: validateBody(updateOrderSchema),
    validateOrderId: validateParams(orderIdSchema),
    validateGetOrders: validateQuery(getOrdersSchema)
};