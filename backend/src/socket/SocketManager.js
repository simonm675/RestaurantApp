const logger = require("../config/logger");

class SocketManager {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.orderRooms = new Map(); // orderId -> [socketIds]
    this.setupMiddleware();
  }

  setupMiddleware() {
    // Authentication Middleware
    this.io.use((socket, next) => {
      const userId = socket.handshake.auth.userId;
      const userRole = socket.handshake.auth.userRole;

      if (!userId) {
        logger.warn("WebSocket connection attempt without userId");
        return next(new Error("Authentication required"));
      }

      socket.userId = userId;
      socket.userRole = userRole || "user";
      next();
    });

    // Connection Handler
    this.io.on("connection", (socket) => {
      logger.info(`User ${socket.userId} connected (socket: ${socket.id})`);
      this.connectedUsers.set(socket.userId, socket.id);

      // Wenn Admin/Küchenpersonal: zum "kitchen" room hinzufügen
      if (["admin", "kitchen"].includes(socket.userRole)) {
        socket.join("kitchen");
        logger.info(`${socket.userId} joined kitchen room`);
      }

      // Wenn Fahrer: zum "delivery" room hinzufügen
      if (socket.userRole === "driver") {
        socket.join("delivery");
      }

      // Disconnect Handler
      socket.on("disconnect", () => {
        logger.info(`User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
      });

      // Error Handler
      socket.on("error", (error) => {
        logger.error(`Socket error for user ${socket.userId}:`, { error: error.message });
      });
    });
  }

  /**
   * Benachrichtige Küche über neue Bestellung
   */
  notifyKitchenNewOrder(order) {
    this.io.to("kitchen").emit("order:created", {
      orderId: order._id,
      items: order.items,
      priority: order.priority,
      createdAt: order.createdAt,
      notes: order.specialInstructions,
    });
    logger.info(`Kitchen notified about new order ${order._id}`);
  }

  /**
   * Benachrichtige Fahrer über Lieferaufträge
   */
  notifyDriverNewDelivery(order) {
    this.io.to("delivery").emit("delivery:assigned", {
      orderId: order._id,
      address: order.address,
      phone: order.phone,
      items: order.items.length,
      createdAt: order.createdAt,
    });
    logger.info(`Drivers notified about delivery ${order._id}`);
  }

  /**
   * Broadcast Order-Status Update zu allem interessierten Clients
   */
  broadcastOrderStatusUpdate(orderId, status, metadata = {}) {
    // An Küche
    this.io.to("kitchen").emit("order:statusChanged", {
      orderId,
      status,
      ...metadata,
    });

    // An User der die Bestellung gemacht hat (optional)
    const userSocket = Array.from(this.connectedUsers.values())[0]; // TODO: userId-spezifisch
    if (userSocket) {
      this.io.to(userSocket).emit("order:statusChanged", {
        orderId,
        status,
        timestamp: new Date().toISOString(),
        ...metadata,
      });
    }

    logger.info(`Order ${orderId} status updated to ${status}`);
  }

  /**
   * Echtzeit-Timer für Bestellungen (Küche: "wie lange läuft Bestellung schon")
   */
  broadcastOrderTimer(orderId, elapsedSeconds) {
    this.io.to("kitchen").emit("order:timer", {
      orderId,
      elapsedSeconds,
      warningLevel:
        elapsedSeconds > 900 ? "critical" : elapsedSeconds > 600 ? "warning" : "normal",
    });
  }

  /**
   * Schicke Echtzeit-Benachrichtigungen
   */
  notifyUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit("notification", {
        id: Math.random(),
        ...notification,
        timestamp: new Date().toISOString(),
      });
      logger.info(`Notification sent to user ${userId}`);
    }
  }

  /**
   * Sende Fehler-Notification (z.B. wenn ein Order fehlschlägt)
   */
  notifyError(rooms, errorMessage) {
    if (Array.isArray(rooms)) {
      rooms.forEach((room) => {
        this.io.to(room).emit("error:notification", {
          message: errorMessage,
          severity: "high",
          timestamp: new Date().toISOString(),
        });
      });
    } else {
      this.io.to(rooms).emit("error:notification", {
        message: errorMessage,
        severity: "high",
        timestamp: new Date().toISOString(),
      });
    }
    logger.error(`Error notification broadcasted: ${errorMessage}`);
  }

  /**
   * Sende Echtzeit-Dashboard-Updates (für Admin-Übersicht)
   */
  broadcastDashboardMetrics(metrics) {
    this.io.to("kitchen").emit("dashboard:metrics", {
      ...metrics,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = SocketManager;
