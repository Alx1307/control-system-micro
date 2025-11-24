const orderEndpoints = {
    /**
     * @swagger
     * /v1/orders:
     *   post:
     *     summary: Создать новый заказ
     *     tags: [Orders]
     *     description: Создание нового заказа. Доступно для пользователей с ролями manager, viewer или engineer.
     *     security:
     *       - bearerAuth: []
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - items
     *             properties:
     *               items:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     name:
     *                       type: string
     *                       description: Наименование позиции
     *                     quantity:
     *                       type: integer
     *                       minimum: 1
     *                       description: Количество
     *                     price:
     *                       type: number
     *                       minimum: 0
     *                       description: Цена за единицу
     *                 description: Список позиций заказа
     *               assignedEngineerId:
     *                 type: string
     *                 format: uuid
     *                 description: ID инженера для назначения (опционально)
     *           examples:
     *             basicOrder:
     *               summary: Базовый заказ
     *               value:
     *                 items:
     *                   - name: "Ремонт оборудования"
     *                     quantity: 1
     *                     price: 1000
     *                   - name: "Диагностика"
     *                     quantity: 1
     *                     price: 500
     *             assignedOrder:
     *               summary: Заказ с назначенным инженером
     *               value:
     *                 items:
     *                   - name: "Установка ПО"
     *                     quantity: 1
     *                     price: 1500
     *                 assignedEngineerId: "123e4567-e89b-12d3-a456-426614174000"
     *     responses:
     *       201:
     *         description: Заказ успешно создан
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     order:
     *                       $ref: '#/components/schemas/Order'
     *                 message:
     *                   type: string
     *                   example: "Заказ создан успешно"
     *       400:
     *         description: Ошибка валидации
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ValidationError'
     *       403:
     *         description: Доступ запрещен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    createOrder: {},
  
    /**
     * @swagger
     * /v1/orders/{orderId}/assign:
     *   patch:
     *     summary: Назначить инженера на заказ
     *     tags: [Orders]
     *     description: Назначение инженера на заказ. Доступно только для пользователей с ролью manager.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orderId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: UUID заказа
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - engineerId
     *             properties:
     *               engineerId:
     *                 type: string
     *                 format: uuid
     *                 description: UUID инженера для назначения
     *     responses:
     *       200:
     *         description: Инженер успешно назначен
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     order:
     *                       $ref: '#/components/schemas/Order'
     *                 message:
     *                   type: string
     *                   example: "Исполнитель назначен успешно"
     *       400:
     *         description: Ошибка валидации или некорректный запрос
     *         content:
     *           application/json:
     *             schema:
     *               oneOf:
     *                 - $ref: '#/components/schemas/ValidationError'
     *                 - $ref: '#/components/schemas/InvalidEngineerError'
     *                 - $ref: '#/components/schemas/CannotAssignError'
     *       403:
     *         description: Доступ запрещен. Требуется роль manager.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       404:
     *         description: Заказ не найден
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OrderNotFoundError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    assignEngineer: {},
  
    /**
     * @swagger
     * /v1/orders/{orderId}:
     *   put:
     *     summary: Обновить заказ
     *     tags: [Orders]
     *     description: Обновление информации о заказе. Доступно только для пользователей с ролью manager.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orderId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: UUID заказа
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               items:
     *                 type: array
     *                 items:
     *                   type: object
     *                   properties:
     *                     name:
     *                       type: string
     *                     quantity:
     *                       type: integer
     *                       minimum: 1
     *                     price:
     *                       type: number
     *                       minimum: 0
     *                 description: Обновленный список позиций заказа
     *     responses:
     *       200:
     *         description: Заказ успешно обновлен
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     order:
     *                       $ref: '#/components/schemas/Order'
     *                 message:
     *                   type: string
     *                   example: "Заказ обновлен успешно"
     *       400:
     *         description: Ошибка валидации
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ValidationError'
     *       403:
     *         description: Доступ запрещен. Требуется роль manager.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       404:
     *         description: Заказ не найден
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OrderNotFoundError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    updateOrder: {},
  
    /**
     * @swagger
     * /v1/orders/user:
     *   get:
     *     summary: Получить заказы текущего пользователя
     *     tags: [Orders]
     *     description: Получение списка заказов текущего пользователя с пагинацией и фильтрацией.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Номер страницы
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *         description: Количество записей на странице
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [created, in_progress, under_review, completed, cancelled]
     *         description: Фильтр по статусу заказа
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [createdAt, updatedAt, status]
     *           default: createdAt
     *         description: Поле для сортировки
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *         description: Порядок сортировки
     *     responses:
     *       200:
     *         description: Список заказов получен успешно
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     orders:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Order'
     *                     pagination:
     *                       type: object
     *                       properties:
     *                         page:
     *                           type: integer
     *                           example: 1
     *                         limit:
     *                           type: integer
     *                           example: 10
     *                         totalOrders:
     *                           type: integer
     *                           example: 25
     *                         totalPages:
     *                           type: integer
     *                           example: 3
     *                 message:
     *                   type: string
     *                   example: "Список заказов получен успешно"
     *       400:
     *         description: Ошибка валидации параметров
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ValidationError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    getUserOrders: {},
  
    /**
     * @swagger
     * /v1/orders/all:
     *   get:
     *     summary: Получить все заказы
     *     tags: [Orders]
     *     description: Получение списка всех заказов с пагинацией и фильтрацией. Доступно для пользователей с ролями manager или viewer.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: query
     *         name: page
     *         schema:
     *           type: integer
     *           minimum: 1
     *           default: 1
     *         description: Номер страницы
     *       - in: query
     *         name: limit
     *         schema:
     *           type: integer
     *           minimum: 1
     *           maximum: 100
     *           default: 10
     *         description: Количество записей на странице
     *       - in: query
     *         name: status
     *         schema:
     *           type: string
     *           enum: [created, in_progress, under_review, completed, cancelled]
     *         description: Фильтр по статусу заказа
     *       - in: query
     *         name: userId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Фильтр по ID пользователя (создателя заказа)
     *       - in: query
     *         name: engineerId
     *         schema:
     *           type: string
     *           format: uuid
     *         description: Фильтр по ID назначенного инженера
     *       - in: query
     *         name: sortBy
     *         schema:
     *           type: string
     *           enum: [createdAt, updatedAt, status]
     *           default: createdAt
     *         description: Поле для сортировки
     *       - in: query
     *         name: sortOrder
     *         schema:
     *           type: string
     *           enum: [asc, desc]
     *           default: desc
     *         description: Порядок сортировки
     *     responses:
     *       200:
     *         description: Список заказов получен успешно
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     orders:
     *                       type: array
     *                       items:
     *                         $ref: '#/components/schemas/Order'
     *                     pagination:
     *                       type: object
     *                       properties:
     *                         page:
     *                           type: integer
     *                           example: 1
     *                         limit:
     *                           type: integer
     *                           example: 10
     *                         totalOrders:
     *                           type: integer
     *                           example: 150
     *                         totalPages:
     *                           type: integer
     *                           example: 15
     *                 message:
     *                   type: string
     *                   example: "Список всех заказов получен успешно"
     *       400:
     *         description: Ошибка валидации параметров
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ValidationError'
     *       403:
     *         description: Доступ запрещен. Требуются права manager или viewer.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    getAllOrders: {},
  
    /**
     * @swagger
     * /v1/orders/statistics:
     *   get:
     *     summary: Получить статистику заказов
     *     tags: [Orders]
     *     description: Получение статистики по заказам. Доступно для пользователей с ролями manager или viewer.
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Статистика получена успешно
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     statistics:
     *                       type: object
     *                       properties:
     *                         totalOrders:
     *                           type: integer
     *                           example: 150
     *                         ordersByStatus:
     *                           type: object
     *                           properties:
     *                             created:
     *                               type: integer
     *                               example: 10
     *                             in_progress:
     *                               type: integer
     *                               example: 25
     *                             under_review:
     *                               type: integer
     *                               example: 15
     *                             completed:
     *                               type: integer
     *                               example: 95
     *                             cancelled:
     *                               type: integer
     *                               example: 5
     *                         averageCompletionTime:
     *                           type: number
     *                           example: 48.5
     *                 message:
     *                   type: string
     *                   example: "Статистика заказов получена успешно"
     *       403:
     *         description: Доступ запрещен. Требуются права manager или viewer.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    getOrderStatistics: {},
  
    /**
     * @swagger
     * /v1/orders/{orderId}:
     *   get:
     *     summary: Получить заказ по ID
     *     tags: [Orders]
     *     description: Получение информации о заказе по его ID.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orderId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: UUID заказа
     *     responses:
     *       200:
     *         description: Данные заказа получены успешно
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     order:
     *                       $ref: '#/components/schemas/Order'
     *                 message:
     *                   type: string
     *                   example: "Заказ получен успешно"
     *       400:
     *         description: Некорректный ID заказа
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ValidationError'
     *       403:
     *         description: Доступ к заказу запрещен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       404:
     *         description: Заказ не найден
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OrderNotFoundError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    getOrderById: {},
  
    /**
     * @swagger
     * /v1/orders/{orderId}/status:
     *   patch:
     *     summary: Обновить статус заказа
     *     tags: [Orders]
     *     description: |
     *       Обновление статуса заказа.
     *       - Менеджеры могут изменять статусы (включая завершение заказа со статуса "на проверке")
     *       - Назначенные инженеры могут изменять статус только с "в работе" на "на проверке"
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orderId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: UUID заказа
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             required:
     *               - status
     *             properties:
     *               status:
     *                 type: string
     *                 enum: [created, in_progress, under_review, completed]
     *                 description: Новый статус заказа
     *     responses:
     *       200:
     *         description: Статус заказа обновлен успешно
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     order:
     *                       $ref: '#/components/schemas/Order'
     *                 message:
     *                   type: string
     *                   example: "Статус заказа обновлен успешно"
     *       400:
     *         description: Ошибка валидации или некорректный переход статуса
     *         content:
     *           application/json:
     *             schema:
     *               oneOf:
     *                 - $ref: '#/components/schemas/ValidationError'
     *                 - $ref: '#/components/schemas/InvalidStatusError'
     *                 - $ref: '#/components/schemas/InvalidStatusTransitionError'
     *       403:
     *         description: Доступ запрещен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       404:
     *         description: Заказ не найден
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OrderNotFoundError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    updateOrderStatus: {},
  
    /**
     * @swagger
     * /v1/orders/{orderId}/cancel:
     *   patch:
     *     summary: Отменить заказ
     *     tags: [Orders]
     *     description: Отмена заказа. Доступно только для пользователей с ролью manager.
     *     security:
     *       - bearerAuth: []
     *     parameters:
     *       - in: path
     *         name: orderId
     *         required: true
     *         schema:
     *           type: string
     *           format: uuid
     *         description: UUID заказа
     *     responses:
     *       200:
     *         description: Заказ успешно отменен
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     order:
     *                       $ref: '#/components/schemas/Order'
     *                 message:
     *                   type: string
     *                   example: "Заказ отменен успешно"
     *       400:
     *         description: Невозможно отменить заказ в текущем статусе
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/CannotCancelError'
     *       403:
     *         description: Доступ запрещен. Требуется роль manager.
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ForbiddenError'
     *       404:
     *         description: Заказ не найден
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/OrderNotFoundError'
     *       500:
     *         description: Внутренняя ошибка сервера
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     *       503:
     *         description: Сервис заказов недоступен
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/ServiceUnavailableError'
     */
    cancelOrder: {},
  
    /**
     * @swagger
     * /v1/orders/health:
     *   get:
     *     summary: Проверить здоровье сервиса заказов
     *     tags: [Orders]
     *     description: Проверка работоспособности сервиса заказов
     *     responses:
     *       200:
     *         description: Сервис заказов работает
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     status:
     *                       type: string
     *                       example: "OK"
     *                     service:
     *                       type: string
     *                       example: "Orders Service"
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                       example: "2023-10-05T12:00:00.000Z"
     *                 message:
     *                   type: string
     *                   example: "Сервис заказов работает нормально"
     *       500:
     *         description: Проблемы с сервисом заказов
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     */
    getHealth: {},
  
    /**
     * @swagger
     * /v1/orders/status:
     *   get:
     *     summary: Получить статус сервиса заказов
     *     tags: [Orders]
     *     description: Получение текущего статуса сервиса заказов
     *     responses:
     *       200:
     *         description: Статус сервиса получен
     *         content:
     *           application/json:
     *             schema:
     *               type: object
     *               properties:
     *                 success:
     *                   type: boolean
     *                   example: true
     *                 data:
     *                   type: object
     *                   properties:
     *                     status:
     *                       type: string
     *                       example: "Orders service is running"
     *                     timestamp:
     *                       type: string
     *                       format: date-time
     *                       example: "2023-10-05T12:00:00.000Z"
     *                 message:
     *                   type: string
     *                   example: "Сервис заказов работает"
     *       500:
     *         description: Проблемы с сервисом заказов
     *         content:
     *           application/json:
     *             schema:
     *               $ref: '#/components/schemas/InternalError'
     */
    getServiceStatus: {}
  };
  
  module.exports = orderEndpoints;