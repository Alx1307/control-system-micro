const authEndpoints = {
  /**
   * @swagger
   * /v1/auth/register:
   *   post:
   *     summary: Регистрация нового пользователя
   *     tags: [Authentication]
   *     description: Создает нового пользователя с ролью "viewer". Роли назначаются автоматически как массив ["viewer"].
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/AuthRequest'
   *           examples:
   *             example1:
   *               summary: Пример запроса
   *               value:
   *                 email: "user@example.com"
   *                 password: "password123"
   *                 name: "Иван Иванов"
   *     responses:
   *       200:
   *         description: Пользователь успешно зарегистрирован
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *             examples:
   *               success:
   *                 summary: Пример успешного ответа
   *                 value:
   *                   success: true
   *                   data:
   *                     user:
   *                       id: "123e4567-e89b-12d3-a456-426614174000"
   *                       email: "user@example.com"
   *                       name: "Иван Иванов"
   *                       roles: ["viewer"]
   *                       isActive: true
   *                       createdAt: "2024-01-15T10:30:00.000Z"
   *                       updatedAt: "2024-01-15T10:30:00.000Z"
   *                   message: "Пользователь успешно зарегистрирован"
   *       400:
   *         description: Ошибка валидации
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       409:
   *         description: Пользователь уже существует
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/UserExistsError'
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
  register: {},

  /**
   * @swagger
   * /v1/auth/login:
   *   post:
   *     summary: Аутентификация пользователя
   *     tags: [Authentication]
   *     description: Вход в систему с email и паролем. Возвращает JWT токен с массивом ролей пользователя.
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/LoginRequest'
   *           examples:
   *             example1:
   *               summary: Пример запроса пользователя
   *               value:
   *                 email: "user@example.com"
   *                 password: "password123"
   *             example2:
   *               summary: Пример запроса менеджера
   *               value:
   *                 email: "manager@example.com"
   *                 password: "manager123"
   *     responses:
   *       200:
   *         description: Успешный вход
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/AuthResponse'
   *             examples:
   *               userSuccess:
   *                 summary: Пример успешного ответа для пользователя
   *                 value:
   *                   success: true
   *                   data:
   *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     user:
   *                       id: "123e4567-e89b-12d3-a456-426614174000"
   *                       email: "user@example.com"
   *                       name: "Иван Иванов"
   *                       roles: ["viewer"]
   *                       isActive: true
   *                       createdAt: "2024-01-15T10:30:00.000Z"
   *                       updatedAt: "2024-01-15T10:30:00.000Z"
   *                   message: "Вход выполнен успешно"
   *               managerSuccess:
   *                 summary: Пример успешного ответа для менеджера
   *                 value:
   *                   success: true
   *                   data:
   *                     token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   *                     user:
   *                       id: "223e4567-e89b-12d3-a456-426614174000"
   *                       email: "manager@example.com"
   *                       name: "Петр Менеджеров"
   *                       roles: ["manager"]
   *                       isActive: true
   *                       createdAt: "2024-01-10T09:15:00.000Z"
   *                       updatedAt: "2024-01-15T11:20:00.000Z"
   *                   message: "Вход выполнен успешно"
   *       400:
   *         description: Ошибка валидации
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/ValidationError'
   *       401:
   *         description: Неверные учетные данные
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/InvalidCredentialsError'
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
  login: {},
};

module.exports = authEndpoints;