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
          enum: ['viewer', 'manager']
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
  }
};

module.exports = schemas;