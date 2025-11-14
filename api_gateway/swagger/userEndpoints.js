const userEndpoints = {
  /**
   * @swagger
   * /v1/users/users:
   *   get:
   *     summary: Получить список пользователей
   *     tags: [Users]
   *     description: Получение списка пользователей с пагинацией и фильтрацией. Доступно только для пользователей с ролью manager.
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
   *         name: role
   *         schema:
   *           type: string
   *           enum: [viewer, manager]
   *         description: Фильтр по роли (ищет пользователей с указанной ролью в массиве roles)
   *       - in: query
   *         name: email
   *         schema:
   *           type: string
   *         description: Фильтр по email
   *       - in: query
   *         name: isActive
   *         schema:
   *           type: boolean
   *         description: Фильтр по активности
   *     responses:
   *       200:
   *         description: Список пользователей получен успешно
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
   *                     users:
   *                       type: array
   *                       items:
   *                         $ref: '#/components/schemas/User'
   *                     pagination:
   *                       type: object
   *                       properties:
   *                         page:
   *                           type: integer
   *                           example: 1
   *                         limit:
   *                           type: integer
   *                           example: 10
   *                         totalUsers:
   *                           type: integer
   *                           example: 50
   *                         totalPages:
   *                           type: integer
   *                           example: 5
   *                 message:
   *                   type: string
   *                   example: "Список пользователей получен успешно"
   *       403:
   *         description: Доступ запрещен. Требуется роль manager.
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
   *         description: Сервис пользователей недоступен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ServiceUnavailableError'
   */
  getUsers: {},

  /**
   * @swagger
   * /v1/users/profile:
   *   get:
   *     summary: Получить профиль текущего пользователя
   *     tags: [Users]
   *     description: Получение профиля авторизованного пользователя.
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Профиль пользователя получен успешно
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
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "Профиль получен успешно"
   *       401:
   *         description: Не авторизован
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ForbiddenError'
   *       404:
   *         description: Пользователь не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserNotFoundError'
   *       500:
   *         description: Внутренняя ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InternalError'
   *       503:
   *         description: Сервис пользователей недоступен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ServiceUnavailableError'
   */
  getProfile: {},

  /**
   * @swagger
   * /v1/users/users/{userId}:
   *   get:
   *     summary: Получить пользователя по ID
   *     tags: [Users]
   *     description: Получение информации о пользователе по его ID. Доступно только для пользователей с ролью manager.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: UUID пользователя
   *     responses:
   *       200:
   *         description: Данные пользователя получены успешно
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
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "Пользователь получен успешно"
   *       400:
   *         description: Некорректный ID пользователя
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
   *         description: Пользователь не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserNotFoundError'
   *       500:
   *         description: Внутренняя ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InternalError'
   *       503:
   *         description: Сервис пользователей недоступен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ServiceUnavailableError'
   */
  getUserById: {},

  /**
   * @swagger
   * /v1/users/users/{userId}:
   *   put:
   *     summary: Обновить профиль пользователя
   *     tags: [Users]
   *     description: |
   *       Обновление профиля пользователя. 
   *       - Пользователи могут обновлять только свой профиль (name, email)
   *       - Менеджеры могут обновлять любой профиль (name, email, roles)
   *       - Изменение ролей доступно только пользователям с ролью manager
   *       - Нельзя изменить свои роли
   *       - В системе должен оставаться хотя бы один активный пользователь с ролью manager
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: UUID пользователя
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "Новое имя"
   *                 description: Имя пользователя
   *               email:
   *                 type: string
   *                 format: email
   *                 example: "newemail@example.com"
   *                 description: Email пользователя
   *               roles:
   *                 type: array
   *                 items:
   *                   type: string
   *                   enum: [viewer, manager]
   *                 example: ["viewer", "manager"]
   *                 description: Массив ролей пользователя (только для менеджеров)
   *           examples:
   *             userUpdate:
   *               summary: Обновление пользователем
   *               value:
   *                 name: "Новое имя"
   *                 email: "newemail@example.com"
   *             managerUpdate:
   *               summary: Обновление менеджером
   *               value:
   *                 name: "Новое имя"
   *                 email: "newemail@example.com"
   *                 roles: ["manager"]
   *     responses:
   *       200:
   *         description: Профиль обновлен успешно
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
   *                     user:
   *                       $ref: '#/components/schemas/User'
   *                 message:
   *                   type: string
   *                   example: "Профиль обновлен успешно"
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
   *               oneOf:
   *                 - $ref: '#/components/schemas/ProfileUpdateForbiddenError'
   *                 - $ref: '#/components/schemas/RoleChangeForbiddenError'
   *                 - $ref: '#/components/schemas/SelfRoleChangeError'
   *                 - $ref: '#/components/schemas/LastManagerError'
   *       404:
   *         description: Пользователь не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserNotFoundError'
   *       500:
   *         description: Внутренняя ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InternalError'
   *       503:
   *         description: Сервис пользователей недоступен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ServiceUnavailableError'
   */
  updateProfile: {},

  /**
   * @swagger
   * /v1/users/users/{userId}:
   *   delete:
   *     summary: Удалить пользователя
   *     tags: [Users]
   *     description: Удаление пользователя по ID. Доступно только для пользователей с ролью manager. Нельзя удалить себя.
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: userId
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: UUID пользователя
   *     responses:
   *       200:
   *         description: Пользователь удален успешно
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
   *                     deletedUser:
   *                       type: object
   *                       properties:
   *                         id:
   *                           type: string
   *                           example: "123e4567-e89b-12d3-a456-426614174000"
   *                         email:
   *                           type: string
   *                           example: "user@example.com"
   *                 message:
   *                   type: string
   *                   example: "Пользователь удален успешно"
   *       400:
   *         description: Некорректный ID пользователя
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       403:
   *         description: Доступ запрещен
   *         content:
   *           application/json:
   *             schema:
   *               oneOf:
   *                 - $ref: '#/components/schemas/ForbiddenError'
   *                 - $ref: '#/components/schemas/SelfDeletionError'
   *       404:
   *         description: Пользователь не найден
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserNotFoundError'
   *       500:
   *         description: Внутренняя ошибка сервера
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InternalError'
   *       503:
   *         description: Сервис пользователей недоступен
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ServiceUnavailableError'
   */
  deleteUser: {}
};

module.exports = userEndpoints;