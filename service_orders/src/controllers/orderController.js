const fakeDb = require('../utils/fakeDb');
const Order = require('../models/Order');
const { OrderStatus, OrderEvents } = require('../config/constants');
const eventEmitter = require('../utils/eventEmitter');
const axios = require('axios');

const ordersController = {
  async createOrder(req, res) {
    try {
      console.log('[CREATE_ORDER] Запрос на создание заказа от пользователя:', req.user.userId);

      const { items, assignedEngineerId = null } = req.body;

      if (assignedEngineerId) {
        console.log('[CREATE_ORDER] Назначен инженер:', assignedEngineerId);
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

      console.log('[CREATE_ORDER] Заказ успешно создан:', savedOrder.id);

      res.success(
        { order: savedOrder },
        'Заказ создан успешно',
        201
      );

    } catch (error) {
      console.error('[CREATE_ORDER] Ошибка:', error);
      res.error('CREATE_ORDER_ERROR', 'Ошибка при создании заказа', 500);
    }
  },

  async assignEngineer(req, res) {
    try {
      console.log('[ASSIGN_ENGINEER] Запрос на назначение исполнителя:', req.params.orderId);
  
      const orderId = req.params.orderId;
      const { engineerId } = req.body;
  
      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }
  
      const order = new Order(orderData);
  
      if (!req.user.roles.includes('manager')) {
        return res.error('FORBIDDEN', 'Только менеджеры могут назначать исполнителей', 403);
      }

      if (!engineerId) {
        return res.error('INVALID_ENGINEER', 'ID инженера обязателен', 400);
      }

      try {
        const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://service_users:8000';
        const response = await axios.get(`${usersServiceUrl}/v1/users/users/${engineerId}`, {
          headers: {
            'Authorization': req.headers['authorization']
          },
          timeout: 5000
        });

        if (!response.data.success) {
          return res.error('INVALID_ENGINEER', 'Указанный инженер не найден', 400);
        }

        const engineer = response.data.data.user;
        if (!engineer.roles.includes('engineer')) {
          return res.error('INVALID_ENGINEER', 'Указанный пользователь не является инженером', 400);
        }

        console.log('[ASSIGN_ENGINEER] Инженер найден:', engineer.id, engineer.email);

      } catch (error) {
        if (error.response && error.response.status === 404) {
          return res.error('INVALID_ENGINEER', 'Указанный инженер не найден', 400);
        }
        console.error('[ASSIGN_ENGINEER] Ошибка проверки инженера:', error.message);
        return res.error('ENGINEER_VALIDATION_ERROR', 'Ошибка при проверке инженера', 500);
      }
  
      if (!order.canBeAssigned()) {
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
  
      console.log('[ASSIGN_ENGINEER] Исполнитель успешно назначен:', orderId, '->', engineerId);
  
      res.success(
        { order: updatedOrder },
        'Исполнитель назначен успешно'
      );
  
    } catch (error) {
      console.error('[ASSIGN_ENGINEER] Ошибка:', error);
      res.error('ASSIGN_ENGINEER_ERROR', 'Ошибка при назначении исполнителя', 500);
    }
  },

  async getOrderById(req, res) {
    try {
      console.log('[GET_ORDER_BY_ID] Запрос на получение заказа:', req.params.orderId);

      const orderId = req.params.orderId;
      const order = await fakeDb.getOrderById(orderId);

      if (!order) {
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      const isOwner = order.userId === req.user.userId;
      const isAssignedEngineer = order.assignedEngineerId === req.user.userId;
      const isManager = req.user.roles.includes('manager');
      const isViewer = req.user.roles.includes('viewer');

      if (req.user.roles.includes('engineer') && !isAssignedEngineer) {
        return res.error('FORBIDDEN', 'Доступ к заказу запрещен', 403);
      }

      if (!isOwner && !isManager && !isViewer && !isAssignedEngineer) {
        return res.error('FORBIDDEN', 'Доступ к заказу запрещен', 403);
      }

      res.success(
        { order },
        'Заказ получен успешно'
      );

    } catch (error) {
      console.error('[GET_ORDER_BY_ID] Ошибка:', error);
      res.error('GET_ORDER_ERROR', 'Ошибка при получении заказа', 500);
    }
  },

  async getUserOrders(req, res) {
    try {
      console.log('[GET_USER_ORDERS] Запрос на получение заказов пользователя:', req.user.userId);

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
        return res.error('VALIDATION_ERROR', 'Некорректные параметры пагинации', 400);
      }

      const filters = {};
      if (status) filters.status = status;
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      let result;
      if (req.user.roles.includes('engineer')) {
        result = await fakeDb.getEngineerOrders(req.user.userId, pageNum, limitNum, filters);
      } else {
        result = await fakeDb.getUserOrders(req.user.userId, pageNum, limitNum, filters);
      }

      console.log(`[GET_USER_ORDERS] Найдено ${result.pagination.totalOrders} заказов`);

      res.success({
        orders: result.orders,
        pagination: result.pagination
      }, 'Список заказов получен успешно');

    } catch (error) {
      console.error('[GET_USER_ORDERS] Ошибка:', error);
      res.error('GET_USER_ORDERS_ERROR', 'Ошибка при получении списка заказов', 500);
    }
  },

  async getAllOrders(req, res) {
    try {
      console.log('[GET_ALL_ORDERS] Запрос на получение всех заказов');

      if (!req.user.roles.includes('manager') && !req.user.roles.includes('viewer')) {
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
        return res.error('VALIDATION_ERROR', 'Некорректные параметры пагинации', 400);
      }

      const filters = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      if (engineerId) filters.engineerId = engineerId;
      filters.sortBy = sortBy;
      filters.sortOrder = sortOrder;

      const result = await fakeDb.getAllOrders(pageNum, limitNum, filters);

      console.log(`[GET_ALL_ORDERS] Найдено ${result.pagination.totalOrders} заказов`);

      res.success({
        orders: result.orders,
        pagination: result.pagination
      }, 'Список всех заказов получен успешно');

    } catch (error) {
      console.error('[GET_ALL_ORDERS] Ошибка:', error);
      res.error('GET_ALL_ORDERS_ERROR', 'Ошибка при получении списка заказов', 500);
    }
  },

  async updateOrderStatus(req, res) {
    try {
      console.log('[UPDATE_ORDER_STATUS] Запрос на обновление статуса заказа:', req.params.orderId);
  
      const orderId = req.params.orderId;
      const { status } = req.body;
  
      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      const order = new Order(orderData);
  
      const isManager = req.user.roles.includes('manager');
      const isAssignedEngineer = order.assignedEngineerId === req.user.userId;
  
      if (!isManager && !isAssignedEngineer) {
        return res.error('FORBIDDEN', 'Доступ к заказу запрещен', 403);
      }
  
      const allowedStatuses = ['created', 'in_progress', 'under_review', 'completed'];
      if (!allowedStatuses.includes(status)) {
        return res.error('INVALID_STATUS', 'Некорректный статус заказа', 400);
      }
  
      const forbiddenTransitions = {
        [OrderStatus.IN_PROGRESS]: [OrderStatus.CREATED],
        [OrderStatus.UNDER_REVIEW]: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS],
        [OrderStatus.COMPLETED]: [OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.UNDER_REVIEW]
      };
  
      if (forbiddenTransitions[order.status]?.includes(status)) {
        return res.error('INVALID_STATUS_TRANSITION', `Невозможно изменить статус с ${order.status} на ${status}`, 400);
      }
  
      if (isManager) {
        if (status === OrderStatus.COMPLETED && order.status !== OrderStatus.UNDER_REVIEW) {
          return res.error('INVALID_STATUS_TRANSITION', 'Менеджер может завершить заказ только со статуса "на проверке"', 400);
        }
        
        if (status === OrderStatus.IN_PROGRESS && order.status !== OrderStatus.UNDER_REVIEW) {
          return res.error('INVALID_STATUS_TRANSITION', 'Менеджер может вернуть заказ на доработку только со статуса "на проверке"', 400);
        }
      } else if (isAssignedEngineer) {
        if (!(order.status === OrderStatus.IN_PROGRESS && status === OrderStatus.UNDER_REVIEW)) {
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
  
      console.log('[UPDATE_ORDER_STATUS] Статус заказа успешно обновлен:', orderId, order.status, '->', status);
  
      res.success(
        { order: updatedOrder },
        'Статус заказа обновлен успешно'
      );
  
    } catch (error) {
      console.error('[UPDATE_ORDER_STATUS] Ошибка:', error);
      res.error('UPDATE_ORDER_STATUS_ERROR', 'Ошибка при обновлении статуса заказа', 500);
    }
  },

  async updateOrder(req, res) {
    try {
      console.log('[UPDATE_ORDER] Запрос на обновление заказа:', req.params.orderId);

      const orderId = req.params.orderId;
      const { items, assignedEngineerId } = req.body;

      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      const order = new Order(orderData);

      if (!req.user.roles.includes('manager')) {
        return res.error('FORBIDDEN', 'Только менеджеры могут изменять заказы', 403);
      }

      const updates = {};
      if (items) updates.items = items;

      if (assignedEngineerId) {
        try {
          const usersServiceUrl = process.env.USERS_SERVICE_URL || 'http://service_users:8000';
          const response = await axios.get(`${usersServiceUrl}/v1/users/users/${assignedEngineerId}`, {
            headers: {
              'Authorization': req.headers['authorization']
            },
            timeout: 5000
          });

          if (!response.data.success) {
            return res.error('ENGINEER_NOT_FOUND', 'Указанный инженер не найден', 404);
          }

          const engineer = response.data.data.user;
          if (!engineer.roles.includes('engineer')) {
            return res.error('NOT_AN_ENGINEER', 'Указанный пользователь не является инженером', 400);
          }

          console.log('[UPDATE_ORDER] Инженер найден:', engineer.id, engineer.email);
          updates.assignedEngineerId = assignedEngineerId;

        } catch (error) {
          if (error.response && error.response.status === 404) {
            return res.error('ENGINEER_NOT_FOUND', 'Указанный инженер не найден', 404);
          }
          console.error('[UPDATE_ORDER] Ошибка проверки инженера:', error.message);
          return res.error('ENGINEER_VALIDATION_ERROR', 'Ошибка при проверке инженера', 500);
        }
      }

      const updatedOrder = await fakeDb.updateOrder(orderId, updates);

      eventEmitter.emit(OrderEvents.ORDER_UPDATED, {
        orderId: updatedOrder.id,
        updatedFields: Object.keys(updates),
        userId: req.user.userId,
        assignedEngineerId: assignedEngineerId
      });

      console.log('[UPDATE_ORDER] Заказ успешно обновлен:', orderId);

      res.success(
        { order: updatedOrder },
        'Заказ обновлен успешно'
      );

    } catch (error) {
      console.error('[UPDATE_ORDER] Ошибка:', error);
      res.error('UPDATE_ORDER_ERROR', 'Ошибка при обновлении заказа', 500);
    }
  },

  async cancelOrder(req, res) {
    try {
      console.log('[CANCEL_ORDER] Запрос на отмену заказа:', req.params.orderId);

      const orderId = req.params.orderId;

      const orderData = await fakeDb.getOrderById(orderId);
      if (!orderData) {
        return res.error('ORDER_NOT_FOUND', 'Заказ не найден', 404);
      }

      const order = new Order(orderData);

      if (!req.user.roles.includes('manager')) {
        return res.error('FORBIDDEN', 'Только менеджеры могут отменять заказы', 403);
      }

      if (!order.canBeCancelled()) {
        return res.error('CANNOT_CANCEL', 'Невозможно отменить заказ в текущем статусе', 400);
      }

      const cancelledOrder = await fakeDb.updateOrderStatus(orderId, OrderStatus.CANCELLED);

      eventEmitter.emit(OrderEvents.ORDER_CANCELLED, {
        orderId: cancelledOrder.id,
        userId: req.user.userId,
        previousStatus: order.status
      });

      console.log('[CANCEL_ORDER] Заказ успешно отменен:', orderId);

      res.success(
        { order: cancelledOrder },
        'Заказ отменен успешно'
      );

    } catch (error) {
      console.error('[CANCEL_ORDER] Ошибка:', error);
      res.error('CANCEL_ORDER_ERROR', 'Ошибка при отмене заказа', 500);
    }
  },

  async getOrderStatistics(req, res) {
    try {
      console.log('[GET_ORDER_STATISTICS] Запрос на получение статистики');

      if (!req.user.roles.includes('manager') && !req.user.roles.includes('viewer')) {
        return res.error('FORBIDDEN', 'Доступ запрещен. Требуются права менеджера или viewer', 403);
      }

      const statistics = await fakeDb.getOrderStatistics();

      res.success(
        { statistics },
        'Статистика заказов получена успешно'
      );

    } catch (error) {
      console.error('[GET_ORDER_STATISTICS] Ошибка:', error);
      res.error('GET_STATISTICS_ERROR', 'Ошибка при получении статистики', 500);
    }
  },

  async getServiceStatus(req, res) {
    try {
      res.success({
        status: 'Orders service is running',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[GET_SERVICE_STATUS] Ошибка:', error);
      res.error('SERVICE_STATUS_ERROR', 'Ошибка при получении статуса сервиса', 500);
    }
  },

  async getHealth(req, res) {
    try {
      res.success({
        status: 'OK',
        service: 'Orders Service',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[GET_HEALTH] Ошибка:', error);
      res.error('HEALTH_CHECK_ERROR', 'Ошибка при проверке здоровья сервиса', 500);
    }
  }
};

module.exports = ordersController;