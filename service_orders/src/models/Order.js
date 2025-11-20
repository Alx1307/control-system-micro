const { v4: uuidv4 } = require('uuid');
const OrderStatus = require('../config/constants').OrderStatus;

class Order {
  constructor({ userId, items, assignedEngineerId = null, status = OrderStatus.CREATED }) {
    this.id = uuidv4();
    this.userId = userId;
    this.items = this.validateItems(items);
    this.assignedEngineerId = assignedEngineerId;
    this.status = status;
    this.totalAmount = this.calculateTotalAmount(items);
    this.createdAt = new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  validateItems(items) {
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    return items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      price: parseFloat(item.price)
    }));
  }

  calculateTotalAmount(items) {
    return items.reduce((total, item) => {
      return total + (item.quantity * item.price);
    }, 0);
  }

  updateStatus(newStatus) {
    if (!Object.values(OrderStatus).includes(newStatus)) {
      throw new Error(`Invalid order status: ${newStatus}`);
    }
    this.status = newStatus;
    this.updatedAt = new Date().toISOString();
  }

  assignEngineer(engineerId) {
    this.assignedEngineerId = engineerId;
    this.updatedAt = new Date().toISOString();
  }

  canBeCancelled() {
    return [OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.UNDER_REVIEW].includes(this.status);
  }

  isCompleted() {
    return this.status === OrderStatus.COMPLETED;
  }

  canBeAssigned() {
    return [OrderStatus.CREATED, OrderStatus.IN_PROGRESS].includes(this.status);
  }

  isAssignedTo(engineerId) {
    return this.assignedEngineerId === engineerId;
  }
}

module.exports = Order;