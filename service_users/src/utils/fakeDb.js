const fs = require('fs').promises;
const path = require('path');
const Logger = require('./logger');

const DB_FILE = path.join(__dirname, 'fakeDb.json');

class FakeDb {
  constructor() {
    this.dbFile = DB_FILE;
  }

  async loadData() {
    try {
      const data = await fs.readFile(this.dbFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async saveData(data) {
    try {
      await fs.writeFile(this.dbFile, JSON.stringify(data, null, 2));
      return true;
    } catch (error) {
      Logger.error(`Ошибка сохранения данных: ${error.message}`);
      throw new Error('Ошибка сохранения данных');
    }
  }

  async addUser(user, requestId = 'unknown') {
    try {
      const users = await this.loadData();
      users[user.id] = user;
      await this.saveData(users);
      Logger.info(`Пользователь добавлен: ${user.email}`, requestId);
      return user;
    } catch (error) {
      Logger.error(`Ошибка при добавлении пользователя: ${error.message}`, requestId);
      throw error;
    }
  }

  async getUserByEmail(email, requestId = 'unknown') {
    try {
      const users = await this.loadData();
      const user = Object.values(users).find(user => user.email === email);
      if (user) {
        Logger.debug(`Пользователь найден по email: ${email}`, requestId);
      } else {
        Logger.debug(`Пользователь не найден по email: ${email}`, requestId);
      }
      return user || null;
    } catch (error) {
      Logger.error(`Ошибка при поиске пользователя по email: ${error.message}`, requestId);
      throw error;
    }
  }

  async getUserById(id, requestId = 'unknown') {
    try {
      const users = await this.loadData();
      const user = users[id];
      if (user) {
        Logger.debug(`Пользователь найден по ID: ${id}`, requestId);
      } else {
        Logger.debug(`Пользователь не найден по ID: ${id}`, requestId);
      }
      return user || null;
    } catch (error) {
      Logger.error(`Ошибка при поиске пользователя по ID: ${error.message}`, requestId);
      throw error;
    }
  }

  async getAllUsers(page = 1, limit = 10, filters = {}, requestId = 'unknown') {
    try {
      Logger.debug('Получение списка пользователей', requestId);
      
      const users = await this.loadData();
      let usersArray = Object.values(users);
      
      if (filters.role) {
        usersArray = usersArray.filter(user => 
          user.roles && user.roles.includes(filters.role)
        );
      }
      
      if (filters.email) {
        usersArray = usersArray.filter(user => 
          user.email.toLowerCase().includes(filters.email.toLowerCase())
        );
      }
      
      if (filters.isActive !== undefined) {
        usersArray = usersArray.filter(user => user.isActive === filters.isActive);
      }

      usersArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedUsers = usersArray.slice(startIndex, endIndex);

      Logger.info(`Найдено ${usersArray.length} пользователей`, requestId);

      return {
        users: paginatedUsers,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(usersArray.length / limit),
          totalUsers: usersArray.length,
          hasNext: endIndex < usersArray.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      Logger.error(`Ошибка при получении списка пользователей: ${error.message}`, requestId);
      throw error;
    }
  }

  async updateUser(id, updates, requestId = 'unknown') {
    try {
      const users = await this.loadData();
      
      if (!users[id]) {
        Logger.warn(`Пользователь не найден при обновлении: ${id}`, requestId);
        return null;
      }

      const currentPasswordHash = users[id].passwordHash;
      
      users[id] = {
        ...users[id],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      if (!updates.passwordHash) {
        users[id].passwordHash = currentPasswordHash;
      }

      await this.saveData(users);
      Logger.info(`Пользователь обновлен: ${id}`, requestId);
      return { ...users[id] };
    } catch (error) {
      Logger.error(`Ошибка при обновлении пользователя: ${error.message}`, requestId);
      throw error;
    }
  }

  async deleteUser(id, requestId = 'unknown') {
    try {
      const users = await this.loadData();
      
      if (!users[id]) {
        Logger.warn(`Пользователь не найден при удалении: ${id}`, requestId);
        return null;
      }

      const deletedUser = { ...users[id] };
      delete users[id];
      
      await this.saveData(users);
      Logger.info(`Пользователь удален: ${id}`, requestId);
      return deletedUser;
    } catch (error) {
      Logger.error(`Ошибка при удалении пользователя: ${error.message}`, requestId);
      throw error;
    }
  }

  async getAllManagers(requestId = 'unknown') {
    try {
      const users = await this.loadData();
      const managers = Object.values(users).filter(user => 
        user.roles && user.roles.includes('manager')
      );
      Logger.debug(`Найдено ${managers.length} менеджеров`, requestId);
      return managers;
    } catch (error) {
      Logger.error(`Ошибка при получении менеджеров: ${error.message}`, requestId);
      throw error;
    }
  }
}

const fakeDb = new FakeDb();

module.exports = fakeDb;