const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fakeDb = require('../utils/fakeDb');

const authController = {
  async register(req, res) {
    try {
      console.log('[REGISTER] Начало регистрации:', req.body);
  
      const { email, password, name } = req.body;
      
      if (!email || !password || !name) {
        return res.error('VALIDATION_ERROR', 'Все поля обязательны для заполнения', 400);
      }

      if (password.length < 6) {
        return res.error('VALIDATION_ERROR', 'Пароль должен содержать минимум 6 символов', 400);
      }
      
      const existingUser = await fakeDb.getUserByEmail(email);
      if (existingUser) {
        return res.error('USER_EXISTS', 'Пользователь с таким email уже существует', 409);
      }
  
      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User(email, passwordHash, name, ['viewer']);
      
      await fakeDb.addUser(user);
  
      console.log('[REGISTER] Пользователь создан с ролями:', user.roles);
  
      const { passwordHash: _, ...userWithoutPassword } = user;
  
      res.success({ 
        user: userWithoutPassword
      }, 'Пользователь успешно зарегистрирован', 201);
  
    } catch (error) {
      console.error('[REGISTER] Ошибка:', error);
      res.error('REGISTRATION_ERROR', 'Ошибка при регистрации', 500);
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.error('VALIDATION_ERROR', 'Email и пароль обязательны', 400);
      }

      const user = await fakeDb.getUserByEmail(email);
      if (!user) {
        return res.error('INVALID_CREDENTIALS', 'Неверный email или пароль', 401);
      }

      if (user.isActive === false) {
        return res.error('ACCOUNT_DISABLED', 'Аккаунт отключен', 403);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
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

      res.success({ 
        token,
        user: userWithoutPassword
      }, 'Вход выполнен успешно');

    } catch (error) {
      console.error('[LOGIN] Ошибка:', error);
      res.error('LOGIN_ERROR', 'Ошибка при входе', 500);
    }
  }
};

module.exports = authController;