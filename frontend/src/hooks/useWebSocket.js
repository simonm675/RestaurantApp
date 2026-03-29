import { useEffect, useRef, useCallback, useState } from "react";
import { io } from "socket.io-client";

/**
 * Custom Hook für WebSocket-Verbindung
 * Handling von Reconnection, Error-Handling, und Event-Subscription
 */
export const useWebSocket = (userId, userRole = "user") => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const socketUrl = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_HOST || "http://localhost:5000";

    // Socket erstellen
    socketRef.current = io(socketUrl, {
      auth: {
        userId,
        userRole,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 20,
      transports: ["websocket", "polling"],
    });

    // Connection Events
    socketRef.current.on("connect", () => {
      setIsConnected(true);
      setError(null);
      setReconnectAttempt(0);
    });

    socketRef.current.on("disconnect", () => {
      setIsConnected(false);
    });

    socketRef.current.on("connect_error", (error) => {
      setError(error.message);
    });

    socketRef.current.on("reconnect_attempt", () => {
      setReconnectAttempt((prev) => prev + 1);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [userId, userRole]);

  // Subscribe zu Event
  const subscribe = useCallback((event, handler) => {
    if (socketRef.current) {
      socketRef.current.on(event, handler);

      // Cleanup
      return () => {
        if (socketRef.current) {
          socketRef.current.off(event, handler);
        }
      };
    }
  }, []);

  // Emit Event
  const emit = useCallback((event, data) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data);
    }
  }, [isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    error,
    reconnectAttempt,
    subscribe,
    emit,
  };
};

/**
 * Spezifischer Hook für Order-Updates
 */
export const useOrderUpdates = (userId, userRole) => {
  const { subscribe, isConnected } = useWebSocket(userId, userRole);
  const [orders, setOrders] = useState([]);
  const [newOrderAlert, setNewOrderAlert] = useState(null);

  useEffect(() => {
    if (!isConnected) return;

    // Neuer Order Event
    const unsubscribeNew = subscribe("order:created", (orderData) => {
      setNewOrderAlert(orderData);

      if (userRole === "user") {
        setOrders((prev) => [orderData, ...prev]);
      }
    });

    // Order Status Update Event
    const unsubscribeStatus = subscribe("order:statusChanged", (data) => {
      setOrders((prev) =>
        prev.map((order) =>
          order.orderId === data.orderId ? { ...order, status: data.status } : order
        )
      );
    });

    return () => {
      unsubscribeNew?.();
      unsubscribeStatus?.();
    };
  }, [isConnected, subscribe, userRole]);

  return {
    orders,
    newOrderAlert,
    setNewOrderAlert,
  };
};
