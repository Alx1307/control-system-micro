const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fakeDb = require('../utils/fakeDb');
const Logger = require('../utils/logger');

const authController = {
  async register(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info('Начало регистрации', requestId);
  
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        Logger.warn('Не все обязательные поля заполнены', requestId);
        return res.error('VALIDATION_ERROR', 'Все поля обязательны для заполнения', 400);
      }

      if (password.length < 6) {
        Logger.warn('Пароль слишком короткий', requestId);
        return res.error('VALIDATION_ERROR', 'Пароль должен содержать минимум 6 символов', 400);
      }
      
      const existingUser = await fakeDb.getUserByEmail(email);
      if (existingUser) {
        Logger.warn(`Пользователь с email уже существует: ${email}`, requestId);
        return res.error('USER_EXISTS', 'Пользователь с таким email уже существует', 409);
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User(email, passwordHash, name, ['viewer']);
      
      await fakeDb.addUser(user);
  
      Logger.info(`Пользователь создан с ролями: ${user.roles}`, requestId);
  
      const { passwordHash: _, ...userWithoutPassword } = user;
  
      res.success({ 
        user: userWithoutPassword
      }, 'Пользователь успешно зарегистрирован', 201);
  
    } catch (error) {
      Logger.error(`Ошибка при регистрации: ${error.message}`, requestId);
      res.error('REGISTRATION_ERROR', 'Ошибка при регистрации', 500);
    }
  },

  async login(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        Logger.warn('Email или пароль не указаны', requestId);
        return res.error('VALIDATION_ERROR', 'Email и пароль обязательны', 400);
      }

      const user = await fakeDb.getUserByEmail(email);
      if (!user) {
        Logger.warn(`Пользователь не найден: ${email}`, requestId);
        return res.error('INVALID_CREDENTIALS', 'Неверный email или пароль', 401);
      }

      if (user.isActive === false) {
        Logger.warn(`Аккаунт отключен: ${email}`, requestId);
        return res.error('ACCOUNT_DISABLED', 'Аккаунт отключен', 403);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        Logger.warn(`Неверный пароль для пользователя: ${email}`, requestId);
        return res.error('INVALID_CREDENTIALS', 'Неверный email или пароль', 401);
      }

      const token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          roles: user.roles
        },
        process.env.JWT_SECRET_KEY || 'fallback-secret',
        { expiresIn: '24h' }
      );

      const { passwordHash, ...userWithoutPassword } = user;

      Logger.info(`Успешный вход пользователя: ${email}`, requestId);

      res.success({ 
        token,
        user: userWithoutPassword
      }, 'Вход выполнен успешно');

    } catch (error) {
      Logger.error(`Ошибка при входе: ${error.message}`, requestId);
      res.error('LOGIN_ERROR', 'Ошибка при входе', 500);
    }
  }
};

module.exports = authController;