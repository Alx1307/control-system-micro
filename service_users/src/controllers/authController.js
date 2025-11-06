const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { addUser, getUserByEmail } = require('../utils/fakeDb');

const authController = {
  async register(req, res) {
    try {
      console.log('[REGISTER] Начало регистрации:', req.body);

      const { email, password, name, role } = req.body;
      
      if (!email || !password || !name) {
        return res.error('VALIDATION_ERROR', 'Все поля обязательны для заполнения', 400);
      }

      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        return res.error('USER_EXISTS', 'Пользователь с таким email уже существует', 409);
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = new User(email, passwordHash, name, role);
      
      await addUser(user);

      console.log('[REGISTER] Пользователь создан и сохранен в fakeDb.json');

      res.success({ 
        user: { 
          id: user.id, 
          email: user.email, 
          name: user.name, 
          role: user.role 
        } 
      }, 'Пользователь успешно зарегистрирован');

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

      const user = await getUserByEmail(email);
      if (!user) {
        return res.error('INVALID_CREDENTIALS', 'Неверный email или пароль', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.error('INVALID_CREDENTIALS', 'Неверный email или пароль', 401);
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET_KEY || 'fallback-secret',
        { expiresIn: '24h' }
      );

      res.success({ 
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      }, 'Вход выполнен успешно');

    } catch (error) {
      console.error('[LOGIN] Ошибка:', error);
      res.error('LOGIN_ERROR', 'Ошибка при входе', 500);
    }
  }
};

module.exports = authController;