const Joi = require('joi');

const russianNameRegex = /^[А-Яа-яЁё\s\-]+$/;
const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{}|,.<>/?]+$/;

const registerSchema = Joi.object({
    email: Joi.string().email().required()
        .messages({
            'string.email': 'Некорректный формат email',
            'any.required': 'Email обязателен для заполнения'
        }),
    password: Joi.string()
        .min(6)
        .max(30)
        .pattern(passwordRegex)
        .required()
        .messages({
            'string.pattern.base': 'Пароль может содержать только латинские буквы, цифры и специальные символы',
            'string.min': 'Пароль должен содержать минимум 6 символов',
            'string.max': 'Пароль не должен превышать 30 символов',
            'any.required': 'Пароль обязателен для заполнения'
        }),
    name: Joi.string()
        .min(2)
        .max(50)
        .pattern(russianNameRegex)
        .required()
        .messages({
            'string.pattern.base': 'Имя должно содержать только русские буквы, пробелы и дефисы',
            'string.min': 'Имя должно содержать минимум 2 символа', 
            'string.max': 'Имя не должно превышать 50 символов',
            'any.required': 'Имя обязательно для заполнения'
        }),
    role: Joi.string().valid('manager', 'viewer', 'engineer').default('viewer')
        .messages({
            'any.only': 'Роль должна быть одной из: manager, viewer, engineer'
        })
});

const loginSchema = Joi.object({
    email: Joi.string().email().required()
        .messages({
            'string.email': 'Некорректный формат email',
            'any.required': 'Email обязателен для заполнения'
        }),
    password: Joi.string().required()
        .messages({
            'any.required': 'Пароль обязателен для заполнения'
        })
});

const updateProfileSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .pattern(russianNameRegex)
        .optional()
        .messages({
            'string.pattern.base': 'Имя должно содержать только русские буквы, пробелы и дефисы',
            'string.min': 'Имя должно содержать минимум 2 символа', 
            'string.max': 'Имя не должно превышать 50 символов'
        }),
    email: Joi.string().email().optional()
        .messages({
            'string.email': 'Некорректный формат email'
        }),
    roles: Joi.array().items(Joi.string().valid('manager', 'viewer', 'engineer')).optional()
        .messages({
            'array.includes': 'Роли должны быть одной из: manager, viewer, engineer'
        })
}).min(1)
.messages({
    'object.min': 'Не указаны поля для обновления'
});

const getUsersSchema = Joi.object({
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
    role: Joi.string().valid('manager', 'viewer', 'engineer').optional()
        .messages({
            'any.only': 'Роль должна быть одной из: manager, viewer, engineer'
        }),
    email: Joi.string().optional(),
    isActive: Joi.string().valid('true', 'false').optional()
        .messages({
            'any.only': 'Параметр isActive должен быть true или false'
        })
});

const userIdSchema = Joi.object({
    userId: Joi.string().min(1).required()
        .messages({
            'string.empty': 'ID пользователя обязателен',
            'any.required': 'ID пользователя обязателен'
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
            console.log(`[VALIDATION_ERROR] ${source}:`, error.details);
            console.log(`[VALIDATION_ERROR] Данные:`, dataToValidate);
            
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
    validateRegister: validateBody(registerSchema),
    validateLogin: validateBody(loginSchema),
    validateUpdateProfile: validateBody(updateProfileSchema),
    validateGetUsers: validateQuery(getUsersSchema),
    validateUserId: validateParams(userIdSchema)
};