import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import KDSBoard from "../components/kds/KDSBoard";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../hooks/useWebSocket";
import { orderApi } from "../services/api";

const OFFLINE_CACHE_KEY = "kds_orders_cache";
const OFFLINE_QUEUE_KEY = "kds_status_queue";

const KitchenPage = () => {
  const { auth } = useAuth();
  const socketUserId = auth?._id || auth?.id || auth?.email || "kds-station";
  const { isConnected, subscribe } = useWebSocket(socketUserId, "admin");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [rushHourMode, setRushHourMode] = useState(false);
  const [actionLocks, setActionLocks] = useState({});
  const [clickFlashId, setClickFlashId] = useState(null);

  const lastNewOrderIdRef = useRef(null);

  const playTone = useCallback((type) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.value = type === "new" ? 880 : 620;
      gain.gain.value = 0.001;

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.start(now);
      osc.stop(now + 0.2);
    } catch {
      // Audio is optional.
    }
  }, []);

  const setAndCacheOrders = useCallback((nextOrders) => {
    setOrders(nextOrders);
    localStorage.setItem(OFFLINE_CACHE_KEY, JSON.stringify(nextOrders));
  }, []);

  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await orderApi.getAll();
      setAndCacheOrders(data);
      setIsOfflineMode(false);
    } catch {
      const cached = localStorage.getItem(OFFLINE_CACHE_KEY);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setOrders(Array.isArray(parsed) ? parsed : []);
          setIsOfflineMode(true);
        } catch {
          if (!silent) toast.error("Küchenansicht konnte nicht geladen werden");
        }
      } else if (!silent) {
        toast.error("Küchenansicht konnte nicht geladen werden");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [setAndCacheOrders]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders({ silent: true });
    }, 10000);

    return () => clearInterval(interval);
  }, [loadOrders]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubCreated = subscribe("order:created", (payload) => {
      playTone("new");
      if (payload?.orderId && payload.orderId !== lastNewOrderIdRef.current) {
        lastNewOrderIdRef.current = payload.orderId;
      }
      loadOrders({ silent: true });
    });

    const unsubStatus = subscribe("order:statusChanged", (payload) => {
      if (!payload?.orderId || !payload?.status) return;

      setOrders((prev) =>
        prev.map((order) =>
          order._id === payload.orderId ? { ...order, status: payload.status, updatedAt: new Date().toISOString() } : order
        )
      );
    });

    return () => {
      unsubCreated?.();
      unsubStatus?.();
    };
  }, [isConnected, loadOrders, playTone, subscribe]);

  const queueActionOffline = useCallback((action) => {
    const existing = localStorage.getItem(OFFLINE_QUEUE_KEY);
    const queue = existing ? JSON.parse(existing) : [];
    queue.push(action);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    const existing = localStorage.getItem(OFFLINE_QUEUE_KEY);
    if (!existing) return;

    const queue = JSON.parse(existing);
    if (!Array.isArray(queue) || queue.length === 0) return;

    const remaining = [];
    for (const item of queue) {
      try {
        await orderApi.updateStatus(item.orderId, { status: item.nextStatus });
      } catch {
        remaining.push(item);
      }
    }

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remaining));
    if (remaining.length === 0) {
      loadOrders({ silent: true });
    }
  }, [loadOrders]);

  useEffect(() => {
    if (!navigator.onLine || !isConnected) return;
    flushOfflineQueue();
  }, [flushOfflineQueue, isConnected]);

  const updateOrderStatus = useCallback(async (order, nextStatus, successMessage) => {
    if (actionLocks[order._id]) return;

    setActionLocks((prev) => ({ ...prev, [order._id]: true }));
    setClickFlashId(order._id);
    setTimeout(() => setClickFlashId(null), 280);

    setOrders((prev) => prev.map((row) => (row._id === order._id ? { ...row, status: nextStatus } : row)));

    try {
      await orderApi.updateStatus(order._id, { status: nextStatus });
      toast.success(successMessage);
      if (nextStatus === "ready-for-pickup" || nextStatus === "out-for-delivery") {
        playTone("done");
      }
    } catch (error) {
      if (!navigator.onLine || !error?.response) {
        queueActionOffline({ orderId: order._id, nextStatus, queuedAt: Date.now() });
        setIsOfflineMode(true);
        toast("Offline: Aktion wird später synchronisiert");
      } else {
        toast.error(error.response?.data?.message || "Statuswechsel fehlgeschlagen");
        loadOrders({ silent: true });
      }
    } finally {
      setActionLocks((prev) => {
        const next = { ...prev };
        delete next[order._id];
        return next;
      });
    }
  }, [actionLocks, loadOrders, playTone, queueActionOffline]);

  const onStart = useCallback((order) => {
    if (order.status !== "pending") return;
    updateOrderStatus(order, "preparing", "In Zubereitung");
  }, [updateOrderStatus]);

  const onFinish = useCallback((order) => {
    if (order.status !== "preparing") return;
    updateOrderStatus(order, "ready-for-pickup", "Bestellung fertig und bereit");
  }, [updateOrderStatus]);

  const onHandOver = useCallback((order) => {
    if (order.status !== "ready-for-pickup" || order.deliveryType !== "delivery") return;
    updateOrderStatus(order, "out-for-delivery", "An Lieferdienst uebergeben");
  }, [updateOrderStatus]);

  const onToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
      return;
    }
    document.exitFullscreen?.();
  }, []);

  const visibleOrders = useMemo(
    () => orders.filter((order) => ["pending", "preparing", "ready-for-pickup", "out-for-delivery"].includes(order.status)),
    [orders]
  );

  if (loading) return <Spinner label="Küchenboard wird geladen" />;

  return (
    <KDSBoard
      orders={visibleOrders}
      isConnected={isConnected}
      isOfflineMode={isOfflineMode}
      rushHourMode={rushHourMode}
      onToggleRushHour={() => setRushHourMode((prev) => !prev)}
      onToggleFullscreen={onToggleFullscreen}
      actionLocks={actionLocks}
      clickFlashId={clickFlashId}
      onStart={onStart}
      onFinish={onFinish}
      onHandOver={onHandOver}
    />
  );
};

export default KitchenPage;




