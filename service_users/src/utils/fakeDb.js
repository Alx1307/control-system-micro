const fs = require('fs').promises;
const path = require('path');

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
      console.error('[FAKE_DB] Ошибка сохранения данных:', error);
      throw new Error('Ошибка сохранения данных');
    }
  }

  async addUser(user) {
    try {
      console.log('[FAKE_DB] Добавление пользователя:', user.email);
      
      const users = await this.loadData();
      users[user.id] = user;
      await this.saveData(users);
      
      console.log('[FAKE_DB] Пользователь успешно добавлен');
      return user;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при добавлении пользователя:', error);
      throw error;
    }
  }

  async getUserByEmail(email) {
    try {
      console.log('[FAKE_DB] Поиск пользователя по email:', email);
      
      const users = await this.loadData();
      const user = Object.values(users).find(user => user.email === email);
      
      if (user) {
        console.log('[FAKE_DB] Пользователь найден:', user.id);
      } else {
        console.log('[FAKE_DB] Пользователь не найден');
      }
      
      return user || null;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при поиске пользователя по email:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      console.log('[FAKE_DB] Поиск пользователя по ID:', id);
      
      const users = await this.loadData();
      const user = users[id];
      
      if (user) {
        console.log('[FAKE_DB] Пользователь найден:', user.email);
      } else {
        console.log('[FAKE_DB] Пользователь не найден');
      }
      
      return user || null;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при поиске пользователя по ID:', error);
      throw error;
    }
  }

  async getAllUsers(page = 1, limit = 10, filters = {}) {
    try {
      console.log('[FAKE_DB] Получение списка пользователей:', { page, limit, filters });
      
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

      const usersWithoutPasswords = paginatedUsers.map(({ passwordHash, ...user }) => user);

      const result = {
        users: usersWithoutPasswords,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(usersArray.length / limit),
          totalUsers: usersArray.length,
          hasNext: endIndex < usersArray.length,
          hasPrev: page > 1
        }
      };

      console.log(`[FAKE_DB] Найдено ${result.pagination.totalUsers} пользователей`);
      
      return result;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при получении списка пользователей:', error);
      throw error;
    }
  }

  async updateUser(id, updates) {
    try {
      console.log('[FAKE_DB] Обновление пользователя:', { id, updates });
      
      const users = await this.loadData();
      
      if (!users[id]) {
        console.log('[FAKE_DB] Пользователь не найден для обновления');
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
      
      console.log('[FAKE_DB] Пользователь успешно обновлен');
      return { ...users[id] };
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при обновлении пользователя:', error);
      throw error;
    }
  }

  async deleteUser(id) {
    try {
      console.log('[FAKE_DB] Удаление пользователя:', id);
      
      const users = await this.loadData();
      
      if (!users[id]) {
        console.log('[FAKE_DB] Пользователь не найден для удаления');
        return null;
      }

      const deletedUser = { ...users[id] };
      delete users[id];
      
      await this.saveData(users);
      
      console.log('[FAKE_DB] Пользователь успешно удален:', deletedUser.email);
      return deletedUser;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при удалении пользователя:', error);
      throw error;
    }
  }

  async getAllManagers() {
    try {
      const users = await this.loadData();
      const managers = Object.values(users).filter(user => 
        user.roles && user.roles.includes('manager')
      );
      return managers;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при получении менеджеров:', error);
      throw error;
    }
  }
}

const fakeDb = new FakeDb();

module.exports = fakeDb;