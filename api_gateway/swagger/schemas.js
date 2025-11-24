const schemas = {
  User: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Уникальный идентификатор пользователя'
      },
      email: {
        type: 'string',
        format: 'email',
        description: 'Email пользователя'
      },
      name: {
        type: 'string',
        description: 'Имя пользователя'
      },
      roles: {
        type: 'array',
        items: {
          type: 'string',
          enum: ['viewer', 'manager', 'engineer']
        },
        description: 'Роли пользователя'
      },
      isActive: {
        type: 'boolean',
        description: 'Статус активности пользователя'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Дата создания пользователя'
      },
      updatedAt: {
        type: 'string', 
        format: 'date-time',
        description: 'Дата обновления пользователя'
      }
    }
  },

  Order: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Уникальный идентификатор заказа'
      },
      userId: {
        type: 'string',
        format: 'uuid',
        description: 'ID пользователя, создавшего заказ'
      },
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Наименование позиции'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              description: 'Количество'
            },
            price: {
              type: 'number',
              minimum: 0,
              description: 'Цена за единицу'
            }
          }
        },
        description: 'Список позиций заказа'
      },
      status: {
        type: 'string',
        enum: ['created', 'in_progress', 'under_review', 'completed', 'cancelled'],
        description: 'Статус заказа'
      },
      assignedEngineerId: {
        type: 'string',
        format: 'uuid',
        description: 'ID назначенного инженера'
      },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Дата создания заказа'
      },
      updatedAt: {
        type: 'string', 
        format: 'date-time',
        description: 'Дата обновления заказа'
      }
    }
  },

  AuthRequest: {
    type: 'object',
    required: ['email', 'password', 'name'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com'
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'password123',
        minLength: 6
      },
      name: {
        type: 'string',
        example: 'Иван Иванов',
        minLength: 2
      }
    }
  },

  LoginRequest: {
    type: 'object',
    required: ['email', 'password'],
    properties: {
      email: {
        type: 'string',
        format: 'email',
        example: 'user@example.com'
      },
      password: {
        type: 'string',
        format: 'password',
        example: 'password123'
      }
    }
  },

  OrderCreateRequest: {
    type: 'object',
    required: ['items'],
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          required: ['name', 'quantity', 'price'],
          properties: {
            name: {
              type: 'string',
              example: 'Ремонт оборудования'
            },
            quantity: {
              type: 'integer',
              minimum: 1,
              example: 1
            },
            price: {
              type: 'number',
              minimum: 0,
              example: 1000
            }
          }
        }
      },
      assignedEngineerId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      }
    }
  },

  OrderUpdateRequest: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: {
              type: 'string'
            },
            quantity: {
              type: 'integer',
              minimum: 1
            },
            price: {
              type: 'number',
              minimum: 0
            }
          }
        }
      }
    }
  },

  AssignEngineerRequest: {
    type: 'object',
    required: ['engineerId'],
    properties: {
      engineerId: {
        type: 'string',
        format: 'uuid',
        example: '123e4567-e89b-12d3-a456-426614174000'
      }
    }
  },

  UpdateOrderStatusRequest: {
    type: 'object',
    required: ['status'],
    properties: {
      status: {
        type: 'string',
        enum: ['created', 'in_progress', 'under_review', 'completed'],
        example: 'in_progress'
      }
    }
  },

  OrderStatistics: {
    type: 'object',
    properties: {
      totalOrders: {
        type: 'integer',
        example: 150
      },
      ordersByStatus: {
        type: 'object',
        properties: {
          created: {
            type: 'integer',
            example: 10
          },
          in_progress: {
            type: 'integer',
            example: 25
          },
          under_review: {
            type: 'integer',
            example: 15
          },
          completed: {
            type: 'integer',
            example: 95
          },
          cancelled: {
            type: 'integer',
            example: 5
          }
        }
      },
      averageCompletionTime: {
        type: 'number',
        example: 48.5
      }
    }
  },

  AuthResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        properties: {
          token: {
            type: 'string',
            description: 'JWT токен для аутентификации'
          },
          user: {
            $ref: '#/components/schemas/User'
          }
        }
      },
      message: {
        type: 'string',
        example: 'Пользователь успешно зарегистрирован'
      }
    }
  },

  HealthResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: true
      },
      data: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            example: 'OK'
          },
          service: {
            type: 'string',
            example: 'Orders Service'
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2023-10-05T12:00:00.000Z'
          }
        }
      }
    }
  },

  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: false
      },
      error: {
        type: 'object',
        properties: {
          code: {
            type: 'string',
            description: 'Код ошибки'
          },
          message: {
            type: 'string',
            description: 'Описание ошибки'
          }
        }
      }
    }
  },

  ValidationError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Все поля обязательны для заполнения'
          }
        }
      }
    ]
  },

  UserExistsError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'USER_EXISTS',
            message: 'Пользователь с таким email уже существует'
          }
        }
      }
    ]
  },

  InvalidCredentialsError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Неверный email или пароль'
          }
        }
      }
    ]
  },

  ForbiddenError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Доступ запрещен. Требуется роль менеджера'
          }
        }
      }
    ]
  },

  UserNotFoundError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'Пользователь не найден'
          }
        }
      }
    ]
  },

  OrderNotFoundError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'ORDER_NOT_FOUND',
            message: 'Заказ не найден'
          }
        }
      }
    ]
  },

  InternalError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Internal server error'
          }
        }
      }
    ]
  },

  ServiceUnavailableError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'SERVICE_UNAVAILABLE',
            message: 'Users service temporarily unavailable'
          }
        }
      }
    ]
  },

  SelfDeletionError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Вы не можете удалить свой аккаунт'
          }
        }
      }
    ]
  },

  SelfRoleChangeError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Вы не можете изменить свою роль'
          }
        }
      }
    ]
  },

  LastManagerError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'В системе должен оставаться хотя бы один активный менеджер'
          }
        }
      }
    ]
  },

  RoleChangeForbiddenError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Изменение роли доступно только менеджерам'
          }
        }
      }
    ]
  },

  ProfileUpdateForbiddenError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Вы можете обновлять только свой профиль'
          }
        }
      }
    ]
  },

  InvalidEngineerError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'INVALID_ENGINEER',
            message: 'Указанный инженер не найден или не является инженером'
          }
        }
      }
    ]
  },

  CannotAssignError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'CANNOT_ASSIGN',
            message: 'Невозможно назначить исполнителя для заказа в текущем статусе'
          }
        }
      }
    ]
  },

  InvalidStatusError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: 'Некорректный статус заказа'
          }
        }
      }
    ]
  },

  InvalidStatusTransitionError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'INVALID_STATUS_TRANSITION',
            message: 'Невозможно изменить статус с текущего на указанный'
          }
        }
      }
    ]
  },

  CannotCancelError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'CANNOT_CANCEL',
            message: 'Невозможно отменить заказ в текущем статусе'
          }
        }
      }
    ]
  },

  EngineerValidationError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'ENGINEER_VALIDATION_ERROR',
            message: 'Ошибка при проверке инженера'
          }
        }
      }
    ]
  },

  OrderCreationError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'CREATE_ORDER_ERROR',
            message: 'Ошибка при создании заказа'
          }
        }
      }
    ]
  },

  AssignEngineerError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'ASSIGN_ENGINEER_ERROR',
            message: 'Ошибка при назначении исполнителя'
          }
        }
      }
    ]
  },

  UpdateOrderError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'UPDATE_ORDER_ERROR',
            message: 'Ошибка при обновлении заказа'
          }
        }
      }
    ]
  },

  CancelOrderError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'CANCEL_ORDER_ERROR',
            message: 'Ошибка при отмене заказа'
          }
        }
      }
    ]
  },

  GetOrdersError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'GET_ORDERS_ERROR',
            message: 'Ошибка при получении списка заказов'
          }
        }
      }
    ]
  },

  GetStatisticsError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'GET_STATISTICS_ERROR',
            message: 'Ошибка при получении статистики'
          }
        }
      }
    ]
  },

  HealthCheckError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'HEALTH_CHECK_ERROR',
            message: 'Ошибка при проверке здоровья сервиса'
          }
        }
      }
    ]
  },

  ServiceStatusError: {
    allOf: [
      { $ref: '#/components/schemas/ErrorResponse' },
      {
        example: {
          success: false,
          error: {
            code: 'SERVICE_STATUS_ERROR',
            message: 'Ошибка при получении статуса сервиса'
          }
        }
      }
    ]
  }

};

module.exports = schemas;