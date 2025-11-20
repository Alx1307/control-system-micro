class EventEmitter {
    constructor() {
      this.events = {};
    }
  
    on(event, listener) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      this.events[event].push(listener);
    }
  
    emit(event, data) {
      console.log(`[EVENT_EMITTER] Emitting event: ${event}`, data);
      
      if (this.events[event]) {
        this.events[event].forEach(listener => {
          try {
            listener(data);
          } catch (error) {
            console.error(`[EVENT_EMITTER] Error in listener for event ${event}:`, error);
          }
        });
      }
    }
  
    removeListener(event, listenerToRemove) {
      if (this.events[event]) {
        this.events[event] = this.events[event].filter(listener => listener !== listenerToRemove);
      }
    }
  
    removeAllListeners(event) {
      if (event) {
        delete this.events[event];
      } else {
        this.events = {};
      }
    }
  }
  
  module.exports = new EventEmitter();