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
      return { orders: {}, users: {} };
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

  async addOrder(order) {
    try {
      const data = await this.loadData();
      data.orders[order.id] = order;
      await this.saveData(data);
      return order;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при добавлении заказа:', error);
      throw error;
    }
  }

  async getOrderById(id) {
    try {
      const data = await this.loadData();
      const order = data.orders[id];
      return order || null;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при поиске заказа по ID:', error);
      throw error;
    }
  }

  async getUserOrders(userId, page = 1, limit = 10, filters = {}) {
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
      console.error('[FAKE_DB] Ошибка при получении заказов пользователя:', error);
      throw error;
    }
  }

  async getEngineerOrders(engineerId, page = 1, limit = 10, filters = {}) {
    try {
      console.log('[FAKE_DB] Получение заказов инженера:', { engineerId, page, limit, filters });
      
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
  
      console.log(`[FAKE_DB] Найдено ${result.pagination.totalOrders} заказов для инженера ${engineerId}`);
      
      return result;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при получении заказов инженера:', error);
      throw error;
    }
  }

  async getAllOrders(page = 1, limit = 10, filters = {}) {
    try {
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
      console.error('[FAKE_DB] Ошибка при получении всех заказов:', error);
      throw error;
    }
  }

  async updateOrder(id, updates) {
    try {
      const data = await this.loadData();
      
      if (!data.orders[id]) {
        return null;
      }

      data.orders[id] = {
        ...data.orders[id],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      await this.saveData(data);
      return { ...data.orders[id] };
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при обновлении заказа:', error);
      throw error;
    }
  }

  async updateOrderStatus(id, status) {
    try {
      const data = await this.loadData();
      
      if (!data.orders[id]) {
        return null;
      }

      data.orders[id].status = status;
      data.orders[id].updatedAt = new Date().toISOString();

      await this.saveData(data);
      return { ...data.orders[id] };
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при обновлении статуса заказа:', error);
      throw error;
    }
  }

  async deleteOrder(id) {
    try {
      const data = await this.loadData();
      
      if (!data.orders[id]) {
        return null;
      }

      const deletedOrder = { ...data.orders[id] };
      delete data.orders[id];
      
      await this.saveData(data);
      return deletedOrder;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при удалении заказа:', error);
      throw error;
    }
  }

  async getOrdersByStatus(status) {
    try {
      const data = await this.loadData();
      const orders = Object.values(data.orders).filter(order => order.status === status);
      return orders;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при поиске заказов по статусу:', error);
      throw error;
    }
  }

  async getUserById(id) {
    try {
      const data = await this.loadData();
      const user = data.users[id];
      return user || null;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при поиске пользователя по ID:', error);
      throw error;
    }
  }

  async getOrderStatistics() {
    try {
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

      return statistics;
    } catch (error) {
      console.error('[FAKE_DB] Ошибка при получении статистики:', error);
      throw error;
    }
  }
}

const fakeDb = new FakeDb();

module.exports = fakeDb;