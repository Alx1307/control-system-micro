Система управления строительными задачами
Описание проекта
Микросервисная система для управления строительными объектами, предназначенная для инженеров, менеджеров и руководителей. Система обеспечивает регистрацию дефектов, назначение задач, контроль сроков и формирование отчетности.

Архитектура
Проект состоит из трех основных компонентов:

API Gateway (api_gateway) - единая точка входа с аутентификацией и rate limiting

Сервис пользователей (service_users) - управление пользователями и аутентификация

Сервис заказов (service_orders) - управление задачами и заказами

Технологический стек
Node.js + Express.js

JWT для аутентификации

Docker + Docker Compose для контейнеризации

Swagger/OpenAPI для документации

Circuit Breaker паттерн для устойчивости сервисов

Быстрый старт
Предварительные требования
Docker

Docker Compose

Запуск проекта
bash
# Клонирование репозитория
git clone <repository-url>
cd control-system-micro

# Запуск всех сервисов
docker-compose up -d

# Просмотр логов
docker-compose logs -f
Проверка работоспособности
После запуска проверьте доступность сервисов:

bash
# Проверка шлюза
curl http://localhost:8000/health

# Проверка сервиса пользователей
curl http://localhost:8000/v1/users/health

# Проверка сервиса заказов
curl http://localhost:8000/v1/orders/health
API Endpoints
Аутентификация
POST /v1/auth/register - Регистрация пользователя

POST /v1/auth/login - Вход в систему

Пользователи
GET /v1/users/profile - Получить профиль текущего пользователя

PUT /v1/users/users/:userId - Обновить профиль

GET /v1/users/users - Список пользователей (только для менеджеров)

Заказы
POST /v1/orders - Создать заказ

GET /v1/orders/user - Список заказов пользователя

GET /v1/orders/:orderId - Получить заказ по ID

PATCH /v1/orders/:orderId/status - Обновить статус заказа

PATCH /v1/orders/:orderId/assign - Назначить инженера на заказ

Роли пользователей
viewer - Наблюдатель (базовые права)

engineer - Инженер (работа с заказами)

manager - Менеджер (управление пользователями и заказами)

Документация API
После запуска проекта документация доступна по адресу:

Swagger UI: http://localhost:8000/api-docs

Мониторинг и логи
Просмотр логов

# Логи конкретного сервиса
docker-compose logs api_gateway
docker-compose logs service_users  
docker-compose logs service_orders

# Логи в реальном времени
docker-compose logs -f api_gateway
Трассировка запросов
Все запросы содержат заголовок X-Request-ID для сквозной трассировки через все сервисы.

Безопасность
JWT аутентификация

Rate limiting

Защита от NoSQL инъекций

XSS защита

CORS настройки

Безопасные HTTP заголовки
