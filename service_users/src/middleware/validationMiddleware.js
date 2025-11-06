const Joi = require('joi');

const russianNameRegex = /^[А-Яа-яЁё\s\-]+$/;
const passwordRegex = /^[A-Za-z0-9!@#$%^&*()_+\-=[\]{}|,.<>/?]+$/;

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string()
        .min(6)
        .max(30)
        .pattern(passwordRegex)
        .required()
        .messages({
            'string.pattern.base': 'Пароль может содержать только латинские буквы, цифры и специальные символы',
            'string.min': 'Пароль должен содержать минимум 6 символов',
            'string.max': 'Пароль не должен превышать 30 символов'
        }),
    name: Joi.string()
        .min(2)
        .max(50)
        .pattern(russianNameRegex)
        .required()
        .messages({
            'string.pattern.base': 'Имя должно содержать только русские буквы, пробелы и дефисы',
            'string.min': 'Имя должно содержать минимум 2 символа', 
            'string.max': 'Имя не должно превышать 50 символов'
        }),
    role: Joi.string().valid('admin', 'viewer', 'engineer').default('viewer')
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: error.details[0].message
                }
            });
        }
        next();
    };
};

module.exports = {
    validateRegister: validate(registerSchema),
    validateLogin: validate(loginSchema)
};