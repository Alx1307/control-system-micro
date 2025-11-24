const fakeDb = require('../utils/fakeDb');
const OrderStatus = require('../config/constants').OrderStatus;

const checkOrderPermission = async (req, res, next) => {
    try {
        const orderId = req.params.orderId || req.params.id;
        console.log('[PERMISSION_MIDDLEWARE] Checking permission for order:', orderId);
        console.log('[PERMISSION_MIDDLEWARE] User:', req.user.userId, 'Roles:', req.user.roles);
        
        const order = await fakeDb.getOrderById(orderId);
        
        if (!order) {
            console.log('[PERMISSION_MIDDLEWARE] Order not found');
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ORDER_NOT_FOUND',
                    message: 'Заказ не найден.'
                }
            });
        }

        const isOwner = order.userId === req.user.userId;
        const isManager = req.user.roles.includes('manager');
        const isViewer = req.user.roles.includes('viewer');
        const isAssignedEngineer = order.assignedEngineerId === req.user.userId;

        console.log('[PERMISSION_MIDDLEWARE] Проверка прав:', {
            isOwner,
            isManager, 
            isViewer,
            isAssignedEngineer,
            orderUserId: order.userId,
            assignedEngineerId: order.assignedEngineerId
        });

        if (isOwner || isManager || isViewer || isAssignedEngineer) {
            console.log('[PERMISSION_MIDDLEWARE] Access granted');
            req.order = order;
            return next();
        }

        if (req.user.roles.includes('engineer') && !isAssignedEngineer) {
            console.log('[PERMISSION_MIDDLEWARE] Инженер не назначен на заказ');
            return res.status(403).json({
                success: false,
                error: {
                    code: 'ACCESS_DENIED',
                    message: 'Инженер может просматривать только назначенные заказы.'
                }
            });
        }

        console.log('[PERMISSION_MIDDLEWARE] Access denied');
        return res.status(403).json({
            success: false,
            error: {
                code: 'ACCESS_DENIED',
                message: 'Доступ к заказу запрещен.'
            }
        });

    } catch (error) {
        console.error('[PERMISSION_MIDDLEWARE] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: {
                code: 'PERMISSION_CHECK_ERROR',
                message: 'Ошибка проверки прав доступа.'
            }
        });
    }
};

const requireManager = (req, res, next) => {
    console.log('[REQUIRE_MANAGER] Checking manager role for user:', req.user.userId);
    
    const hasManagerRole = req.user.roles.includes('manager');
    
    if (!hasManagerRole) {
        console.log('[REQUIRE_MANAGER] Manager role required');
        return res.status(403).json({
            success: false,
            error: {
                code: 'MANAGER_REQUIRED',
                message: 'Требуются права менеджера.'
            }
        });
    }
    
    console.log('[REQUIRE_MANAGER] Manager access granted');
    next();
};

const checkStatusTransition = (req, res, next) => {
    const { status } = req.body;
    const currentStatus = req.order ? req.order.status : null;
    
    console.log('[STATUS_TRANSITION] Checking transition from', currentStatus, 'to', status);

    const allowedTransitions = {
        'created': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [],
        'cancelled': []
    };

    if (currentStatus && !allowedTransitions[currentStatus]?.includes(status)) {
        console.log('[STATUS_TRANSITION] Invalid status transition');
        return res.status(400).json({
            success: false,
            error: {
                code: 'INVALID_STATUS_TRANSITION',
                message: `Невозможно изменить статус с ${currentStatus} на ${status}`
            }
        });
    }

    console.log('[STATUS_TRANSITION] Status transition allowed');
    next();
};

const checkOrderOwner = async (req, res, next) => {
    try {
        const orderId = req.params.orderId || req.params.id;
        console.log('[ORDER_OWNER] Checking if user is order owner:', req.user.userId);
        
        const order = await fakeDb.getOrderById(orderId);
        
        if (!order) {
            console.log('[ORDER_OWNER] Order not found');
            return res.status(404).json({
                success: false,
                error: {
                    code: 'ORDER_NOT_FOUND',
                    message: 'Заказ не найден.'
                }
            });
        }

        if (order.userId !== req.user.userId) {
            console.log('[ORDER_OWNER] User is not order owner');
            return res.status(403).json({
                success: false,
                error: {
                    code: 'NOT_ORDER_OWNER',
                    message: 'Вы не являетесь владельцем этого заказа.'
                }
            });
        }

        req.order = order;
        console.log('[ORDER_OWNER] User is order owner');
        next();
    } catch (error) {
        console.error('[ORDER_OWNER] Error:', error.message);
        return res.status(500).json({
            success: false,
            error: {
                code: 'OWNER_CHECK_ERROR',
                message: 'Ошибка проверки владельца заказа.'
            }
        });
    };
};

const canCreateOrder = (req, res, next) => {
    console.log('[CAN_CREATE_ORDER] Checking if user can create order:', req.user.userId);
    
    const isManager = req.user.roles.includes('manager');
    
    if (!isManager) {
        console.log('[CAN_CREATE_ORDER] User is not manager, access denied');
        return res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: 'Только менеджеры могут создавать заказы.'
            }
        });
    }
    
    console.log('[CAN_CREATE_ORDER] User is manager, access granted');
    next();
};

module.exports = {
    checkOrderPermission,
    requireManager,
    canCreateOrder,
    checkStatusTransition,
    checkOrderOwner
};