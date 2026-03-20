/**
 * Socket.io Client Service
 * Handles real-time messaging connections
 */

class SocketClient {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.listeners = new Map();
  }

  /**
   * Initialize Socket.io connection
   * @param {string} token - JWT access token
   */
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    if (!token) {
      console.error('Cannot connect: No token provided');
      return;
    }

    try {
      // Import socket.io-client dynamically
      // For now, we'll use CDN version
      if (typeof io === 'undefined') {
        console.error('Socket.io client not loaded. Please include socket.io-client library.');
        return;
      }

      // Get base URL - detect environment
      const getServerURL = () => {
        if (window.location.hostname === 'dev-sayo.github.io' || window.location.hostname.includes('github.io')) {
          return 'https://roompal-wrgn.onrender.com';
        }
        return 'http://localhost:5002';
      };
      const serverURL = getServerURL();

      this.socket = io(serverURL, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts,
      });

      this.setupEventHandlers();
    } catch (error) {
      console.error('Error connecting to socket:', error);
    }
  }

  /**
   * Setup socket event handlers
   */
  setupEventHandlers() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Socket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.reconnectAttempts++;
      this.emit('error', error);
    });

    // Message events
    this.socket.on('message_sent', (data) => {
      this.emit('message_sent', data);
    });

    this.socket.on('new_message', (data) => {
      this.emit('new_message', data);
    });

    this.socket.on('message_read_receipt', (data) => {
      this.emit('message_read_receipt', data);
    });

    // User status events
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Typing events
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
      this.emit('error', error);
    });
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * Send message via socket
   * @param {string} receiverId - Receiver user ID
   * @param {string} content - Message content
   */
  sendMessage(receiverId, content) {
    if (!this.socket || !this.isConnected) {
      throw new Error('Socket not connected');
    }

    this.socket.emit('send_message', {
      receiverId,
      content: content.trim(),
    });
  }

  /**
   * Mark message as read
   * @param {string} messageId - Message ID
   */
  markMessageAsRead(messageId) {
    if (!this.socket || !this.isConnected) {
      // Fallback to REST API
      if (typeof api !== 'undefined' && api.messages) {
        return api.messages.markAsRead(messageId);
      }
      return;
    }

    this.socket.emit('message_read', {
      messageId,
    });
  }

  /**
   * Start typing indicator
   * @param {string} receiverId - Receiver user ID
   */
  startTyping(receiverId) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing_start', {
      receiverId,
    });
  }

  /**
   * Stop typing indicator
   * @param {string} receiverId - Receiver user ID
   */
  stopTyping(receiverId) {
    if (!this.socket || !this.isConnected) return;

    this.socket.emit('typing_stop', {
      receiverId,
    });
  }

  /**
   * Add event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Remove event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function to remove
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   * @returns {boolean} - True if connected
   */
  getConnectionStatus() {
    return this.isConnected;
  }
}

// Create singleton instance
const socketClient = new SocketClient();

// Auto-connect if token exists
if (typeof api !== 'undefined' && api.getAuthToken) {
  const token = api.getAuthToken();
  if (token) {
    socketClient.connect(token);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = socketClient;
} else {
  window.socketClient = socketClient;
}
