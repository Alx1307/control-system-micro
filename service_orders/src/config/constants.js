const OrderStatus = Object.freeze({
    CREATED: 'created',
    IN_PROGRESS: 'in_progress',
    UNDER_REVIEW: 'under_review',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
  });
  
  const OrderEvents = Object.freeze({
    ORDER_CREATED: 'ORDER_CREATED',
    ORDER_UPDATED: 'ORDER_UPDATED',
    ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
    ORDER_CANCELLED: 'ORDER_CANCELLED'
  });
  
  module.exports = { OrderStatus, OrderEvents };