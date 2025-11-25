const fakeDb = require('../utils/fakeDb');
const Order = require('../models/Order');
const { OrderStatus, OrderEvents } = require('../config/constants');
const eventEmitter = require('../utils/eventEmitter');
const axios = require('axios');
const Logger = require('../utils/logger');

const ordersController = {
  async createOrder(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на создание заказа от пользователя: ${req.user.userId}`, requestId);

      const { items, assignedEngineerId = null } = req.body;

      if (assignedEngineerId) {
        Logger.info(`Назначен инженер: ${assignedEngineerId}`, requestId);
      }

      const order = new Order({
        userId: req.user.userId,
        items,
        assignedEngineerId
      });

      const savedOrder = await fakeDb.addOrder(order);

      eventEmitter.emit(OrderEvents.ORDER_CREATED, {
        ...savedOrder,
        assignedEngineerId: assignedEngineerId
      });

      Logger.info(`Заказ успешно создан: ${savedOrder.id}`, requestId);

      res.success(
        { order: savedOrder },
        'Заказ создан успешно',
        201
      );

    } catch (error) {
      Logger.error(`Ошибка при создании заказа: ${error.message}`, requestId);
      res.error('CREATE_ORDER_ERROR', 'Ошибка при создании заказа', 500);
    }
  },

  async assignEngineer(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на назначение исполнителя: ${req.params.orderId}`, requestId);
  
      const orderId = req.params.orderId;
      const { engineerId } = req.body;
  
      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        Logger.warn(`Заказ не найден: ${orderId}`, requestId);
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }
  
      const order = new Order(orderData);
  
      if (!req.user.roles.includes('manager')) {
        Logger.warn(`Попытка назначения без прав менеджера: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Только менеджеры могут назначать исполнителей', 403);
      }

      if (!engineerId) {
        Logger.warn('ID инженера не указан', requestId);
        return res.error('INVALID_ENGINEER', 'ID инженера обязателен', 400);
      }

      try {
        const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://service_users:8000';
        const response = await axios.get(`${usersServiceUrl}/v1/users/users/${engineerId}`, {
          headers: {
            'Authorization': req.headers['authorization'],
            'X-Request-ID': requestId
          },
          timeout: 5000
        });

        if (!response.data.success) {
          Logger.warn(`Указанный инженер не найден: ${engineerId}`, requestId);
          return res.error('INVALID_ENGINEER', 'Указанный инженер не найден', 400);
        }

        const engineer = response.data.data.user;
        if (!engineer.roles.includes('engineer')) {
          Logger.warn(`Пользователь не является инженером: ${engineerId}`, requestId);
          return res.error('INVALID_ENGINEER', 'Указанный пользователь не является инженером', 400);
        }

        Logger.info(`Инженер найден: ${engineer.id}, ${engineer.email}`, requestId);

      } catch (error) {
        if (error.response && error.response.status === 404) {
          Logger.warn(`Инженер не найден: ${engineerId}`, requestId);
          return res.error('INVALID_ENGINEER', 'Указанный инженер не найден', 400);
        }
        Logger.error(`Ошибка проверки инженера: ${error.message}`, requestId);
        return res.error('ENGINEER_VALIDATION_ERROR', 'Ошибка при проверке инженера', 500);
      }
  
      if (!order.canBeAssigned()) {
        Logger.warn(`Невозможно назначить исполнителя для заказа в статусе: ${order.status}`, requestId);
        return res.error('CANNOT_ASSIGN', 'Невозможно назначить исполнителя для заказа в текущем статусе', 400);
      }
  
      const updatedOrder = await fakeDb.updateOrder(orderId, {
        assignedEngineerId: engineerId,
        status: OrderStatus.IN_PROGRESS
      });
  
      eventEmitter.emit(OrderEvents.ORDER_STATUS_CHANGED, {
        orderId: updatedOrder.id,
        previousStatus: order.status,
        newStatus: updatedOrder.status,
        assignedEngineerId: engineerId,
        userId: req.user.userId,
        eventType: 'ENGINEER_ASSIGNED'
      });
  
      Logger.info(`Исполнитель успешно назначен: ${orderId} -> ${engineerId}`, requestId);
  
      res.success(
        { order: updatedOrder },
        'Исполнитель назначен успешно'
      );
  
    } catch (error) {
      Logger.error(`Ошибка при назначении исполнителя: ${error.message}`, requestId);
      res.error('ASSIGN_ENGINEER_ERROR', 'Ошибка при назначении исполнителя', 500);
    }
  },

  async getOrderById(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на получение заказа: ${req.params.orderId}`, requestId);

      const order = req.order || await fakeDb.getOrderById(req.params.orderId);

      if (!order) {
        Logger.warn(`Заказ не найден: ${req.params.orderId}`, requestId);
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      Logger.info(`Доступ разрешен, возвращаем заказ: ${req.params.orderId}`, requestId);
      res.success({ order }, 'Заказ получен успешно');

    } catch (error) {
      Logger.error(`Ошибка при получении заказа: ${error.message}`, requestId);
      res.error('GET_ORDER_ERROR', 'Ошибка при получении заказа', 500);
    }
  },

  async getUserOrders(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на получение заказов пользователя: ${req.user.userId}`, requestId);

      const { 
        page = 1, 
        limit = 10, 
        status, 
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        Logger.warn(`Некорректные параметры пагинации: page=${page}, limit=${limit}`, requestId);
        return res.error('VALIDATION_ERROR', 'Некорректные параметры пагинации', 400);
      }

      const filters = {};
      if (status) filters.status = status;
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      let result;
      if (req.user.roles.includes('engineer')) {
        Logger.debug(`Получение заказов для инженера: ${req.user.userId}`, requestId);
        result = await fakeDb.getEngineerOrders(req.user.userId, pageNum, limitNum, filters);
      } else {
        Logger.debug(`Получение заказов для пользователя: ${req.user.userId}`, requestId);
        result = await fakeDb.getUserOrders(req.user.userId, pageNum, limitNum, filters);
      }

      Logger.info(`Найдено ${result.pagination.totalOrders} заказов`, requestId);

      res.success({
        orders: result.orders,
        pagination: result.pagination
      }, 'Список заказов получен успешно');

    } catch (error) {
      Logger.error(`Ошибка при получении списка заказов: ${error.message}`, requestId);
      res.error('GET_USER_ORDERS_ERROR', 'Ошибка при получении списка заказов', 500);
    }
  },

  async getAllOrders(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info('Запрос на получение всех заказов', requestId);

      if (!req.user.roles.includes('manager') && !req.user.roles.includes('viewer')) {
        Logger.warn(`Попытка доступа без прав менеджера/viewer: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуются права менеджера или viewer', 403);
      }

      const { 
        page = 1, 
        limit = 10, 
        status, 
        userId,
        engineerId,
        sortBy = 'createdAt', 
        sortOrder = 'desc' 
      } = req.query;

      const pageNum = parseInt(page);
      const limitNum = parseInt(limit);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        Logger.warn(`Некорректные параметры пагинации: page=${page}, limit=${limit}`, requestId);
        return res.error('VALIDATION_ERROR', 'Некорректные параметры пагинации', 400);
      }

      const filters = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      if (engineerId) filters.engineerId = engineerId;
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      const result = await fakeDb.getAllOrders(pageNum, limitNum, filters);

      Logger.info(`Найдено ${result.pagination.totalOrders} заказов`, requestId);

      res.success({
        orders: result.orders,
        pagination: result.pagination
      }, 'Список всех заказов получен успешно');

    } catch (error) {
      Logger.error(`Ошибка при получении списка заказов: ${error.message}`, requestId);
      res.error('GET_ALL_ORDERS_ERROR', 'Ошибка при получении списка заказов', 500);
    }
  },

  async updateOrderStatus(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на обновление статуса заказа: ${req.params.orderId}`, requestId);
  
      const orderId = req.params.orderId;
      const { status } = req.body;
  
      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        Logger.warn(`Заказ не найден: ${orderId}`, requestId);
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      const order = new Order(orderData);
  
      const isManager = req.user.roles.includes('manager');
      const isAssignedEngineer = order.assignedEngineerId === req.user.userId;
  
      if (!isManager && !isAssignedEngineer) {
        Logger.warn(`Доступ к заказу запрещен для пользователя: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Доступ к заказу запрещен', 403);
      }
  
      const allowedStatuses = ['created', 'in_progress', 'under_review', 'completed'];
      if (!allowedStatuses.includes(status)) {
        Logger.warn(`Некорректный статус заказа: ${status}`, requestId);
        return res.error('INVALID_STATUS', 'Некорректный статус заказа', 400);
      }
  
      const forbiddenTransitions = {
        [OrderStatus.IN_PROGRESS]: [OrderStatus.CREATED],
        [OrderStatus.UNDER_REVIEW]: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS],
        [OrderStatus.COMPLETED]: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.UNDER_REVIEW]
      };
  
      if (forbiddenTransitions[order.status]?.includes(status)) {
        Logger.warn(`Невозможно изменить статус с ${order.status} на ${status}`, requestId);
        return res.error('INVALID_STATUS_TRANSITION', `Невозможно изменить статус с ${order.status} на ${status}`, 400);
      }
  
      if (isManager) {
        if (status === OrderStatus.COMPLETED && order.status !== OrderStatus.UNDER_REVIEW) {
          Logger.warn(`Менеджер пытается завершить заказ не со статуса "на проверке": ${order.status}`, requestId);
          return res.error('INVALID_STATUS_TRANSITION', 'Менеджер может завершить заказ только со статуса "на проверке"', 400);
        }
        
        if (status === OrderStatus.IN_PROGRESS && order.status !== OrderStatus.UNDER_REVIEW) {
          Logger.warn(`Менеджер пытается вернуть заказ на доработку не со статуса "на проверке": ${order.status}`, requestId);
          return res.error('INVALID_STATUS_TRANSITION', 'Менеджер может вернуть заказ на доработку только со статуса "на проверке"', 400);
        }
      } else if (isAssignedEngineer) {
        if (!(order.status === OrderStatus.IN_PROGRESS && status === OrderStatus.UNDER_REVIEW)) {
          Logger.warn(`Инженер пытается изменить статус не по правилам: ${order.status} -> ${status}`, requestId);
          return res.error('INVALID_STATUS_TRANSITION', 'Инженер может изменить статус только с "в работе" на "на проверке"', 400);
        }
      }
  
      const updatedOrder = await fakeDb.updateOrderStatus(orderId, status);
  
      eventEmitter.emit(OrderEvents.ORDER_STATUS_CHANGED, {
        orderId: updatedOrder.id,
        previousStatus: order.status,
        newStatus: updatedOrder.status,
        userId: req.user.userId
      });
  
      Logger.info(`Статус заказа успешно обновлен: ${orderId}, ${order.status} -> ${status}`, requestId);
  
      res.success(
        { order: updatedOrder },
        'Статус заказа обновлен успешно'
      );
  
    } catch (error) {
      Logger.error(`Ошибка при обновлении статуса заказа: ${error.message}`, requestId);
      res.error('UPDATE_ORDER_STATUS_ERROR', 'Ошибка при обновлении статуса заказа', 500);
    }
  },

  async updateOrder(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на обновление заказа: ${req.params.orderId}`, requestId);

      const orderId = req.params.orderId;
      const { items } = req.body;

      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        Logger.warn(`Заказ не найден: ${orderId}`, requestId);
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      if (!req.user.roles.includes('manager')) {
        Logger.warn(`Попытка обновления заказа без прав менеджера: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Только менеджеры могут изменять заказы', 403);
      }

      const updates = {};
      if (items) updates.items = items;

      const updatedOrder = await fakeDb.updateOrder(orderId, updates);

      eventEmitter.emit(OrderEvents.ORDER_UPDATED, {
        orderId: updatedOrder.id,
        updatedFields: Object.keys(updates),
        userId: req.user.userId
      });

      Logger.info(`Заказ успешно обновлен: ${orderId}`, requestId);

      res.success(
        { order: updatedOrder },
        'Заказ обновлен успешно'
      );

    } catch (error) {
      Logger.error(`Ошибка при обновлении заказа: ${error.message}`, requestId);
      res.error('UPDATE_ORDER_ERROR', 'Ошибка при обновлении заказа', 500);
    }
  },

  async cancelOrder(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info(`Запрос на отмену заказа: ${req.params.orderId}`, requestId);

      const orderId = req.params.orderId;

      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        Logger.warn(`Заказ не найден: ${orderId}`, requestId);
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      const order = new Order(orderData);

      if (!req.user.roles.includes('manager')) {
        Logger.warn(`Попытка отмены заказа без прав менеджера: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Только менеджеры могут отменять заказы', 403);
      }

      if (!order.canBeCancelled()) {
        Logger.warn(`Невозможно отменить заказ в статусе: ${order.status}`, requestId);
        return res.error('CANNOT_CANCEL', 'Невозможно отменить заказ в текущем статусе', 400);
      }

      const cancelledOrder = await fakeDb.updateOrderStatus(orderId, OrderStatus.CANCELLED);

      eventEmitter.emit(OrderEvents.ORDER_CANCELLED, {
        orderId: cancelledOrder.id,
        userId: req.user.userId,
        previousStatus: order.status
      });

      Logger.info(`Заказ успешно отменен: ${orderId}`, requestId);

      res.success(
        { order: cancelledOrder },
        'Заказ отменен успешно'
      );

    } catch (error) {
      Logger.error(`Ошибка при отмене заказа: ${error.message}`, requestId);
      res.error('CANCEL_ORDER_ERROR', 'Ошибка при отмене заказа', 500);
    }
  },

  async getOrderStatistics(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      Logger.info('Запрос на получение статистики', requestId);

      if (!req.user.roles.includes('manager') && !req.user.roles.includes('viewer')) {
        Logger.warn(`Попытка доступа к статистике без прав: ${req.user.userId}`, requestId);
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуются права менеджера или viewer', 403);
      }

      const statistics = await fakeDb.getOrderStatistics();

      Logger.info(`Статистика получена: ${statistics.total} заказов`, requestId);

      res.success(
        { statistics },
        'Статистика заказов получена успешно'
      );

    } catch (error) {
      Logger.error(`Ошибка при получении статистики: ${error.message}`, requestId);
      res.error('GET_STATISTICS_ERROR', 'Ошибка при получении статистики', 500);
    }
  },

  async getServiceStatus(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      res.success({
        status: 'Orders service is running',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error(`Ошибка при получении статуса сервиса: ${error.message}`, requestId);
      res.error('SERVICE_STATUS_ERROR', 'Ошибка при получении статуса сервиса', 500);
    }
  },

  async getHealth(req, res) {
    const requestId = req.headers['x-request-id'] || 'unknown';
    
    try {
      res.success({
        status: 'OK',
        service: 'Orders Service',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error(`Ошибка при проверке здоровья сервиса: ${error.message}`, requestId);
      res.error('HEALTH_CHECK_ERROR', 'Ошибка при проверке здоровья сервиса', 500);
    }
  }
};

module.exports = ordersController;