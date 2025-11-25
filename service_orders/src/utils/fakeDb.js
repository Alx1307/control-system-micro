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
      return { orders: {}, users: {} };
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

  async addOrder(order, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      data.orders[order.id] = order;
      await this.saveData(data);
      Logger.info(`Заказ добавлен: ${order.id}`, requestId);
      return order;
    } catch (error) {
      Logger.error(`Ошибка при добавлении заказа: ${error.message}`, requestId);
      throw error;
    }
  }

  async getOrderById(id, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      const order = data.orders[id];
      if (order) {
        Logger.debug(`Заказ найден: ${id}`, requestId);
      } else {
        Logger.debug(`Заказ не найден: ${id}`, requestId);
      }
      return order || null;
    } catch (error) {
      Logger.error(`Ошибка при поиске заказа по ID: ${error.message}`, requestId);
      throw error;
    }
  }

  async getUserOrders(userId, page = 1, limit = 10, filters = {}, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      let ordersArray = Object.values(data.orders).filter(order => order.userId === userId);
      
      if (filters.status) {
        ordersArray = ordersArray.filter(order => order.status === filters.status);
      }
      
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      ordersArray.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = ordersArray.slice(startIndex, endIndex);

      Logger.info(`Найдено ${ordersArray.length} заказов для пользователя ${userId}`, requestId);

      return {
        orders: paginatedOrders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(ordersArray.length / limit),
          totalOrders: ordersArray.length,
          hasNext: endIndex < ordersArray.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      Logger.error(`Ошибка при получении заказов пользователя: ${error.message}`, requestId);
      throw error;
    }
  }

  async getEngineerOrders(engineerId, page = 1, limit = 10, filters = {}, requestId = 'unknown') {
    try {
      Logger.debug(`Получение заказов инженера: ${engineerId}`, requestId);
      
      const data = await this.loadData();
      let ordersArray = Object.values(data.orders).filter(order => order.assignedEngineerId === engineerId);
      
      if (filters.status) {
        ordersArray = ordersArray.filter(order => order.status === filters.status);
      }
      
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      ordersArray.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
  
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = ordersArray.slice(startIndex, endIndex);
  
      const result = {
        orders: paginatedOrders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(ordersArray.length / limit),
          totalOrders: ordersArray.length,
          hasNext: endIndex < ordersArray.length,
          hasPrev: page > 1
        }
      };
  
      Logger.info(`Найдено ${result.pagination.totalOrders} заказов для инженера ${engineerId}`, requestId);
      
      return result;
    } catch (error) {
      Logger.error(`Ошибка при получении заказов инженера: ${error.message}`, requestId);
      throw error;
    }
  }

  async getAllOrders(page = 1, limit = 10, filters = {}, requestId = 'unknown') {
    try {
      Logger.debug('Получение всех заказов', requestId);
      
      const data = await this.loadData();
      let ordersArray = Object.values(data.orders);
      
      if (filters.status) {
        ordersArray = ordersArray.filter(order => order.status === filters.status);
      }
      
      if (filters.userId) {
        ordersArray = ordersArray.filter(order => order.userId === filters.userId);
      }
      
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder || 'desc';
      
      ordersArray.sort((a, b) => {
        const aValue = a[sortBy];
        const bValue = b[sortBy];
        
        if (sortOrder === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedOrders = ordersArray.slice(startIndex, endIndex);

      Logger.info(`Найдено ${ordersArray.length} заказов`, requestId);

      return {
        orders: paginatedOrders,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(ordersArray.length / limit),
          totalOrders: ordersArray.length,
          hasNext: endIndex < ordersArray.length,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      Logger.error(`Ошибка при получении всех заказов: ${error.message}`, requestId);
      throw error;
    }
  }

  async updateOrder(id, updates, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      
      if (!data.orders[id]) {
        Logger.warn(`Заказ не найден при обновлении: ${id}`, requestId);
        return null;
      }

      data.orders[id] = {
        ...data.orders[id],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.saveData(data);
      Logger.info(`Заказ обновлен: ${id}`, requestId);
      return { ...data.orders[id] };
    } catch (error) {
      Logger.error(`Ошибка при обновлении заказа: ${error.message}`, requestId);
      throw error;
    }
  }

  async updateOrderStatus(id, status, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      
      if (!data.orders[id]) {
        Logger.warn(`Заказ не найден при обновлении статуса: ${id}`, requestId);
        return null;
      }

      data.orders[id].status = status;
      data.orders[id].updatedAt = new Date().toISOString();

      await this.saveData(data);
      Logger.info(`Статус заказа обновлен: ${id} -> ${status}`, requestId);
      return { ...data.orders[id] };
    } catch (error) {
      Logger.error(`Ошибка при обновлении статуса заказа: ${error.message}`, requestId);
      throw error;
    }
  }

  async deleteOrder(id, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      
      if (!data.orders[id]) {
        Logger.warn(`Заказ не найден при удалении: ${id}`, requestId);
        return null;
      }

      const deletedOrder = { ...data.orders[id] };
      delete data.orders[id];
      
      await this.saveData(data);
      Logger.info(`Заказ удален: ${id}`, requestId);
      return deletedOrder;
    } catch (error) {
      Logger.error(`Ошибка при удалении заказа: ${error.message}`, requestId);
      throw error;
    }
  }

  async getOrdersByStatus(status, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      const orders = Object.values(data.orders).filter(order => order.status === status);
      Logger.debug(`Найдено ${orders.length} заказов со статусом ${status}`, requestId);
      return orders;
    } catch (error) {
      Logger.error(`Ошибка при поиске заказов по статусу: ${error.message}`, requestId);
      throw error;
    }
  }

  async getUserById(id, requestId = 'unknown') {
    try {
      const data = await this.loadData();
      const user = data.users[id];
      if (user) {
        Logger.debug(`Пользователь найден: ${id}`, requestId);
      } else {
        Logger.debug(`Пользователь не найден: ${id}`, requestId);
      }
      return user || null;
    } catch (error) {
      Logger.error(`Ошибка при поиске пользователя по ID: ${error.message}`, requestId);
      throw error;
    }
  }

  async getOrderStatistics(requestId = 'unknown') {
    try {
      Logger.debug('Получение статистики заказов', requestId);
      
      const data = await this.loadData();
      const orders = Object.values(data.orders);
      
      const statistics = {
        total: orders.length,
        byStatus: {
          created: orders.filter(o => o.status === 'created').length,
          in_progress: orders.filter(o => o.status === 'in_progress').length,
          completed: orders.filter(o => o.status === 'completed').length,
          cancelled: orders.filter(o => o.status === 'cancelled').length
        },
        totalRevenue: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, order) => sum + (order.totalAmount || 0), 0)
      };

      Logger.info(`Статистика получена: ${statistics.total} заказов`, requestId);

      return statistics;
    } catch (error) {
      Logger.error(`Ошибка при получении статистики: ${error.message}`, requestId);
      throw error;
    }
  }
}

const fakeDb = new FakeDb();

module.exports = fakeDb;