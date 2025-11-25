const fakeDb = require('../utils/fakeDb');
const Logger = require('../utils/logger');

const usersController = {
  async getUsers(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info('Запрос на получение списка пользователей', requestId);

      if (!req.user.roles.includes('manager')) {
        Logger.warn(`Попытка доступа без прав менеджера: ${req.user.userId}`, requestId);
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
        Logger.warn(`Некорректные параметры пагинации: page=${page}, limit=${limit}`, requestId);
        return res.error('VALIDATION_ERROR', 'Некорректные параметры пагинации', 400);
      }

      const filters = {};
      if (role) filters.role = role;
      if (email) filters.email = email;
      if (isActive !== undefined) filters.isActive = isActive === 'true';

      const result = await fakeDb.getAllUsers(pageNum, limitNum, filters);

      const usersWithoutPasswords = result.users.map(({ passwordHash, ...user }) => user);

      Logger.info(`Найдено ${result.pagination.totalUsers} пользователей`, requestId);

      res.success({
        users: usersWithoutPasswords,
        pagination: result.pagination
      }, 'Список пользователей получен успешно');

    } catch (error) {
      Logger.error(`Ошибка при получении списка пользователей: ${error.message}`, requestId);
      res.error('GET_USERS_ERROR', 'Ошибка при получении списка пользователей', 500);
    }
  },

  async getCurrentProfile(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на получение профиля пользователя: ${req.user.userId}`, requestId);
  
      const user = await fakeDb.getUserById(req.user.userId);
  
      if (!user) {
        Logger.warn(`Пользователь не найден: ${req.user.userId}`, requestId);
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }
  
      const { passwordHash, ...userProfile } = user;
  
      Logger.info(`Профиль получен для пользователя: ${req.user.userId}`, requestId);
  
      res.success({ user: userProfile }, 'Профиль получен успешно');
  
    } catch (error) {
      Logger.error(`Ошибка при получении профиля: ${error.message}`, requestId);
      res.error('GET_PROFILE_ERROR', 'Ошибка при получении профиля', 500);
    }
  },

  async getUserById(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на получение пользователя: ${req.params.userId}`, requestId);
  
      if (!req.user.roles.includes('manager')) {
        Logger.warn(`Попытка доступа без прав менеджера: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуется роль менеджера', 403);
      }
  
      const userId = req.params.userId;
  
      const user = await fakeDb.getUserById(userId);
  
      if (!user) {
        Logger.warn(`Пользователь не найден: ${userId}`, requestId);
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }
  
      const { passwordHash, ...userData } = user;
  
      Logger.info(`Пользователь получен: ${userId}`, requestId);
  
      res.success({ user: userData }, 'Пользователь получен успешно');
  
    } catch (error) {
      Logger.error(`Ошибка при получении пользователя: ${error.message}`, requestId);
      res.error('GET_USER_ERROR', 'Ошибка при получении пользователя', 500);
    }
  },

  async updateProfile(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на обновление профиля: ${req.user.userId}`, requestId);
  
      const userId = req.params.userId;
      const currentUserId = req.user.userId;
      const currentUserRoles = req.user.roles;

      if (userId !== currentUserId && !currentUserRoles.includes('manager')) {
        Logger.warn(`Попытка обновления чужого профиля: ${req.user.userId} -> ${userId}`, requestId);
        return res.error('FORBIDDEN', 'Вы можете обновлять только свой профиль', 403);
      }

      const { name, email, roles } = req.body;
  
      if (!name && !email && !roles) {
        Logger.warn('Не указаны поля для обновления', requestId);
        return res.error('VALIDATION_ERROR', 'Не указаны поля для обновления', 400);
      }
  
      if (roles && !currentUserRoles.includes('manager')) {
        Logger.warn(`Попытка изменения ролей без прав менеджера: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Изменение ролей доступно только менеджерам', 403);
      }

      if (roles && userId === currentUserId) {
        Logger.warn(`Попытка изменения собственных ролей: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Вы не можете изменить свои роли', 403);
      }

      const currentUserData = await fakeDb.getUserById(userId);
      if (!currentUserData) {
        Logger.warn(`Пользователь не найден: ${userId}`, requestId);
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
            Logger.warn('Попытка удалить последнего менеджера в системе', requestId);
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
        Logger.warn(`Пользователь не найден при обновлении: ${userId}`, requestId);
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }

      const { passwordHash, ...userProfile } = updatedUser;
  
      Logger.info(`Профиль успешно обновлен: ${userId}`, requestId);
  
      res.success({ user: userProfile }, 'Профиль обновлен успешно');
  
    } catch (error) {
      Logger.error(`Ошибка при обновлении профиля: ${error.message}`, requestId);
      res.error('UPDATE_PROFILE_ERROR', 'Ошибка при обновлении профиля', 500);
    }
  },

  async deleteUser(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на удаление пользователя: ${req.params.userId}`, requestId);

      if (!req.user.roles.includes('manager')) {
        Logger.warn(`Попытка удаления без прав менеджера: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуется роль менеджера', 403);
      }

      const userId = req.params.userId;

      if (userId === req.user.userId) {
        Logger.warn(`Попытка удаления собственного аккаунта: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Вы не можете удалить свой аккаунт', 403);
      }

      const userToDelete = await fakeDb.getUserById(userId);
      if (!userToDelete) {
        Logger.warn(`Пользователь не найден: ${userId}`, requestId);
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }

      if (userToDelete.roles.includes('manager')) {
        const allManagers = await fakeDb.getAllManagers();
        if (allManagers.length <= 1) {
          Logger.warn('Попытка удалить последнего менеджера в системе', requestId);
          return res.error('FORBIDDEN', 'Нельзя удалить последнего менеджера в системе', 403);
        }
      }

      const deletedUser = await fakeDb.deleteUser(userId);

      if (!deletedUser) {
        Logger.warn(`Пользователь не найден при удалении: ${userId}`, requestId);
        return res.error('USER_NOT_FOUND', 'Пользователь не найден', 404);
      }

      Logger.info(`Пользователь успешно удален: ${deletedUser.email}`, requestId);

      const { passwordHash, ...userWithoutPassword } = deletedUser;

      res.success({ 
        deletedUser: userWithoutPassword
      }, 'Пользователь удален успешно');

    } catch (error) {
      Logger.error(`Ошибка при удалении пользователя: ${error.message}`, requestId);
      res.error('DELETE_USER_ERROR', 'Ошибка при удалении пользователя', 500);
    }
  }
};

module.exports = usersController;