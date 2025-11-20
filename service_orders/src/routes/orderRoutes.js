const express = require('express');
const router = express.Router();

const ordersController = require('../controllers/orderController');
const authenticateToken = require('../middleware/authMiddleware');
const { 
  validateCreateOrder, 
  validateUpdateOrderStatus, 
  validateOrderId, 
  validateGetOrders,
  validateAssignEngineer,
  validateUpdateOrder
} = require('../middleware/validationMiddleware');
const { 
  checkOrderPermission, 
  requireManager,
  canCreateOrder
} = require('../middleware/permissionMiddleware');

router.get('/status', ordersController.getServiceStatus);
router.get('/health', ordersController.getHealth);

router.post('/', authenticateToken, canCreateOrder, validateCreateOrder, ordersController.createOrder);
router.patch('/:orderId/assign', authenticateToken, requireManager, validateAssignEngineer, ordersController.assignEngineer);
router.put('/:orderId', authenticateToken, requireManager, validateUpdateOrder, ordersController.updateOrder);
router.get('/user', authenticateToken, validateGetOrders, ordersController.getUserOrders);
router.get('/all', authenticateToken, validateGetOrders, ordersController.getAllOrders);
router.get('/statistics', authenticateToken, requireManager, ordersController.getOrderStatistics);
router.get('/:orderId', authenticateToken, validateOrderId, checkOrderPermission, ordersController.getOrderById);
router.patch('/:orderId/status', authenticateToken, validateOrderId, validateUpdateOrderStatus, checkOrderPermission, ordersController.updateOrderStatus);
router.patch('/:orderId/cancel', authenticateToken, validateOrderId, requireManager, ordersController.cancelOrder);

module.exports = router;