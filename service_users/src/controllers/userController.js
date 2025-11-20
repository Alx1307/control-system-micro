const fakeDb = require('../utils/fakeDb');

const usersController = {
  async getUsers(req, res) {
    try {
      console.log('[GET_USERS] Запрос на получение списка пользователей');

      if (!req.user.roles.includes('manager')) {
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

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        return res.error('VALIDATION_ERROR', 'Некорректные параметры пагинации', 400);
      }

      const filters = {};
      if (role) filters.role = role;
      if (email) filters.email = email;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const result = await fakeDb.getAllUsers(pageNum, limitNum, filters);

      const usersWithoutPasswords = result.users.map(({ passwordHash, ...user }) => user);

      console.log(`[GET_USERS] Найдено ${result.pagination.totalUsers} пользователей`);

      res.success({
        users: usersWithoutPasswords,
        pagination: result.pagination
      }, 'Список пользователей получен успешно');

    } catch (error) {
      console.error('[GET_USERS] Ошибка:', error);
      res.error('GET_USERS_ERROR', 'Ошибка при получении списка пользователей', 500);
    }
  },

  async getCurrentProfile(req, res) {
    try {
      console.log('[GET_PROFILE] Запрос на получение профиля пользователя:', req.user.userId);
  
      const user = await fakeDb.getUserById(req.user.userId);
  
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
  
      if (!req.user.roles.includes('manager')) {
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуется роль менеджера', 403);
      }
  
      const userId = req.params.userId;
  
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
      const currentUserRoles = req.user.roles;

      if (userId !== currentUserId && !currentUserRoles.includes('manager')) {
        return res.error('FORBIDDEN', 'Вы можете обновлять только свой профиль', 403);
      }

      const { name, email, roles } = req.body;
  
      if (!name && !email && !roles) {
        return res.error('VALIDATION_ERROR', 'Не указаны поля для обновления', 400);
      }
  
      if (roles && !currentUserRoles.includes('manager')) {
        return res.error('FORBIDDEN', 'Изменение ролей доступно только менеджерам', 403);
      }

      if (roles && userId === currentUserId) {
        return res.error('FORBIDDEN', 'Вы не можете изменить свои роли', 403);
      }

      const currentUserData = await fakeDb.getUserById(userId);
      if (!currentUserData) {
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }

      if (roles && currentUserRoles.includes('manager') && userId !== currentUserId) {
        const isCurrentUserManager = currentUserData.roles.includes('manager');
        const isNewRoleManager = Array.isArray(roles) ? roles.includes('manager') : false;
        
        if (isCurrentUserManager || isNewRoleManager) {
          const allManagers = await fakeDb.getAllManagers();
          const activeManagers = allManagers.filter(manager => 
            manager.isActive !== false && manager.id !== currentUserId
          );
          
          if (activeManagers.length === 0 && !isNewRoleManager) {
            return res.error('FORBIDDEN', 'В системе должен оставаться хотя бы один активный менеджер', 403);
          }
        }
      }
  
      const updates = {};
      if (name) updates.name = name;
      if (email) updates.email = email;
      if (roles) updates.roles = Array.isArray(roles) ? roles : [roles];
  
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

      if (!req.user.roles.includes('manager')) {
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуется роль менеджера', 403);
      }

      const userId = req.params.userId;

      if (userId === req.user.userId) {
        return res.error('FORBIDDEN', 'Вы не можете удалить свой аккаунт', 403);
      }

      const userToDelete = await fakeDb.getUserById(userId);
      if (!userToDelete) {
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }

      if (userToDelete.roles.includes('manager')) {
        const allManagers = await fakeDb.getAllManagers();
        if (allManagers.length <= 1) {
          return res.error('FORBIDDEN', 'Нельзя удалить последнего менеджера в системе', 403);
        }
      }

      const deletedUser = await fakeDb.deleteUser(userId);

      if (!deletedUser) {
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }

      console.log('[DELETE_USER] Пользователь успешно удален:', deletedUser.email);

      const { passwordHash, ...userWithoutPassword } = deletedUser;

      res.success({ 
        deletedUser: userWithoutPassword
      }, 'Пользователь удален успешно');

    } catch (error) {
      console.error('[DELETE_USER] Ошибка:', error);
      res.error('DELETE_USER_ERROR', 'Ошибка при удалении пользователя', 500);
    }
  }
};

module.exports = usersController;