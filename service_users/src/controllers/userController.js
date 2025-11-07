const fakeDb = require('../utils/fakeDb');

const usersController = {
  async getUsers(req, res) {
    try {
      console.log('[GET_USERS] Запрос на получение списка пользователей');

      if (req.user.role !== 'manager') {
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуется роль менеджера', 403);
      }

      const { 
        page = 1, 
        limit = 10, 
        role, 
        email, 
        isActive 
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (isNaN(pageNum) || pageNum < 1) {
        return res.error('VALIDATION_ERROR', 'Параметр page должен быть положительным числом', 400);
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.error('VALIDATION_ERROR', 'Параметр limit должен быть от 1 до 100', 400);
      }

      const filters = {};
      if (role) filters.role = role;
      if (email) filters.email = email;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const result = await fakeDb.getAllUsers(pageNum, limitNum, filters);

      console.log(`[GET_USERS] Найдено ${result.pagination.totalUsers} пользователей`);

      res.success({
        users: result.users,
        pagination: result.pagination
      }, 'Список пользователей получен успешно');

    } catch (error) {
      console.error('[GET_USERS] Ошибка:', error);
      res.error('GET_USERS_ERROR', 'Ошибка при получении списка пользователей', 500);
    }
  },

  async getCurrentProfile(req, res) {
    try {
      console.log('[GET_PROFILE] Запрос на получение профиля пользователя:', req.user);
      console.log('[GET_PROFILE] Ищем пользователя с ID:', req.user.userId);
  
      const user = await fakeDb.getUserById(req.user.userId);
  
      console.log('[GET_PROFILE] Найденный пользователь:', user);
  
      if (!user) {
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }
  
      const { passwordHash, ...userProfile } = user;
  
      res.success({ user: userProfile }, 'Профиль получен успешно');
  
    } catch (error) {
      console.error('[GET_PROFILE] Ошибка:', error);
      res.error('GET_PROFILE_ERROR', 'Ошибка при получении профиля', 500);
    }
  },

  async getUserById(req, res) {
    try {
      console.log('[GET_USER_BY_ID] Запрос на получение пользователя:', req.params.userId);
  
      if (req.user.role !== 'manager') {
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуется роль менеджера', 403);
      }
  
      const userId = req.params.userId;
      
      if (!userId || typeof userId !== 'string') {
        return res.error('VALIDATION_ERROR', 'Некорректный ID пользователя', 400);
      }
  
      if (userId.length !== 36 || userId.split('-').length !== 5) {
        return res.error('VALIDATION_ERROR', 'Некорректный формат ID пользователя', 400);
      }
  
      const user = await fakeDb.getUserById(userId);
  
      if (!user) {
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }
  
      const { passwordHash, ...userData } = user;
  
      res.success({ user: userData }, 'Пользователь получен успешно');
  
    } catch (error) {
      console.error('[GET_USER_BY_ID] Ошибка:', error);
      res.error('GET_USER_ERROR', 'Ошибка при получении пользователя', 500);
    }
  },

  async updateProfile(req, res) {
    try {
      console.log('[UPDATE_PROFILE] Запрос на обновление профиля:', req.user.userId);
  
      const userId = req.params.userId;
      const currentUserId = req.user.userId;
  
      if (userId !== currentUserId) {
        return res.error('FORBIDDEN', 'Вы можете обновлять только свой профиль', 403);
      }
  
      const { name, email } = req.body;
  
      if (!name && !email) {
        return res.error('VALIDATION_ERROR', 'Не указаны поля для обновления', 400);
      }
  
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.error('VALIDATION_ERROR', 'Некорректный формат email', 400);
        }
      }
  
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
  
      const updatedUser = await fakeDb.updateUser(userId, updates);
  
      if (!updatedUser) {
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }
  
      const { passwordHash, ...userProfile } = updatedUser;
  
      console.log('[UPDATE_PROFILE] Профиль успешно обновлен');
  
      res.success({ user: userProfile }, 'Профиль обновлен успешно');
  
    } catch (error) {
      console.error('[UPDATE_PROFILE] Ошибка:', error);
      res.error('UPDATE_PROFILE_ERROR', 'Ошибка при обновлении профиля', 500);
    }
  },

  async deleteUser(req, res) {
    try {
      console.log('[DELETE_USER] Запрос на удаление пользователя:', req.params.userId);
  
      if (req.user.role !== 'manager') {
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуется роль менеджера', 403);
      }
  
      const userId = req.params.userId;
      
      if (!userId || typeof userId !== 'string') {
        return res.error('VALIDATION_ERROR', 'Некорректный ID пользователя', 400);
      }
  
      if (userId === req.user.userId) {
        return res.error('FORBIDDEN', 'Вы не можете удалить свой аккаунт', 403);
      }
  
      const deletedUser = await fakeDb.deleteUser(userId);
  
      if (!deletedUser) {
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }
  
      console.log('[DELETE_USER] Пользователь успешно удален:', deletedUser.email);
  
      res.success({ 
        deletedUser: { 
          id: deletedUser.id, 
          email: deletedUser.email 
        } 
      }, 'Пользователь удален успешно');
  
    } catch (error) {
      console.error('[DELETE_USER] Ошибка:', error);
      res.error('DELETE_USER_ERROR', 'Ошибка при удалении пользователя', 500);
    }
  }
};

module.exports = usersController;