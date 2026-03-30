import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Bike, CheckCircle2, ChefHat, Clock3, Home, PackageSearch } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useOrderTimer from "../hooks/useOrderTimer";
import { orderApi } from "../services/api";

const LAST_ORDER_STORAGE_KEY = "restaurantLastPlacedOrder";
const ACTIVE_ORDER_STATUSES = ["pending", "preparing", "ready-for-pickup", "out-for-delivery"];

const STATUS_META = {
  pending: {
    title: "Bestellung eingegangen",
    subtitle: "Wir haben deine Bestellung erhalten und bestaetigen sie gerade.",
    step: 1,
  },
  preparing: {
    title: "In Zubereitung",
    subtitle: "Die Kueche arbeitet bereits an deiner Bestellung.",
    step: 2,
  },
  "ready-for-pickup": {
    title: "Ready",
    subtitle: "Die Bestellung ist fertig und wartet auf den naechsten Schritt.",
    step: 3,
  },
  "out-for-delivery": {
    title: "Unterwegs",
    subtitle: "Der Fahrer ist auf dem Weg zu dir.",
    step: 3,
  },
  completed: {
    title: "Zugestellt",
    subtitle: "Guten Appetit und danke fuer deine Bestellung.",
    step: 4,
  },
  cancelled: {
    title: "Bestellung storniert",
    subtitle: "Bei Fragen melde dich bitte direkt bei uns.",
    step: 1,
  },
};

const STEP_ITEMS = [
  { key: "pending", label: "Eingegangen", icon: PackageSearch },
  { key: "preparing", label: "Kueche", icon: ChefHat },
  { key: "delivery", label: "Unterwegs", icon: Bike },
  { key: "completed", label: "Fertig", icon: CheckCircle2 },
];

const getOrderPin = (order) => {
  const raw = String(order?.orderNumber || order?._id || "").replace(/\D/g, "");
  const base = raw.slice(-3) || "842";
  return base.padStart(3, "0");
};

const getStatusChangedAt = (order, status) => {
  if (!order) return null;
  const history = Array.isArray(order.statusHistory) ? order.statusHistory : [];
  const match = [...history].reverse().find((entry) => entry?.status === status);
  if (match?.changedAt) return new Date(match.changedAt).getTime();
  if (order.status === status && order.updatedAt) return new Date(order.updatedAt).getTime();
  return null;
};

const getStageElapsedMinutes = (order, status) => {
  const changedAtMs = getStatusChangedAt(order, status);
  if (!changedAtMs) return 0;
  return Math.max(0, Math.floor((Date.now() - changedAtMs) / 60000));
};

const getEtaWindow = (timer, order) => {
  if (!order) return "--";

  if (order.status === "cancelled") return "--";
  if (order.status === "completed") return "0-2";

  if (order.status === "ready-for-pickup") {
    if (order.deliveryType === "pickup") return "0-5";
    const readyMinutes = getStageElapsedMinutes(order, "ready-for-pickup");
    const remainingToDispatch = Math.max(3, 12 - readyMinutes);
    const min = Math.max(4, remainingToDispatch);
    const max = min + 8;
    return `${min}-${max}`;
  }

  if (order.status === "out-for-delivery") {
    const deliveryMinutes = getStageElapsedMinutes(order, "out-for-delivery");
    const remaining = Math.max(2, 16 - deliveryMinutes);
    const min = Math.max(2, remaining - 3);
    const max = min + 6;
    return `${min}-${max}`;
  }

  const fallback = Number(order?.estimatedPrepMinutes || 25);
  const remainingMins = timer.remainingSeconds !== null
    ? Math.max(1, Math.ceil(Math.max(0, timer.remainingSeconds) / 60))
    : fallback;

  const min = Math.max(5, remainingMins - 5);
  const max = Math.max(min + 5, remainingMins + 5);

  return `${min}-${max}`;
};

const getStageProgress = (order, timer) => {
  if (!order) return 2;

  if (order.status === "pending") {
    return clamp(Number(timer.progressPercent || 0) * 0.35, 4, 30);
  }

  if (order.status === "preparing") {
    return clamp(30 + Number(timer.progressPercent || 0) * 0.4, 30, 72);
  }

  if (order.status === "ready-for-pickup") {
    if (order.deliveryType === "pickup") return 100;
    const readyMinutes = getStageElapsedMinutes(order, "ready-for-pickup");
    return clamp(72 + readyMinutes * 1.5, 72, 86);
  }

  if (order.status === "out-for-delivery") {
    const deliveryMinutes = getStageElapsedMinutes(order, "out-for-delivery");
    return clamp(86 + deliveryMinutes * 1.3, 86, 99);
  }

  return order.status === "completed" ? 100 : 98;
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const pickNewestRelevantOrder = (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) return null;

  const active = orders.filter((entry) =>
    ["pending", "preparing", "ready-for-pickup", "out-for-delivery"].includes(entry.status)
  );
  if (active.length === 0) return null;

  return [...active].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
};

const OrderTrackingPage = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [order, setOrder] = useState(() => location.state?.order || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const navOrder = location.state?.order;
    if (navOrder) {
      if (ACTIVE_ORDER_STATUSES.includes(navOrder.status)) {
        localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(navOrder));
        setOrder(navOrder);
      } else {
        localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
        setOrder(null);
      }
      return;
    }

    try {
      const saved = localStorage.getItem(LAST_ORDER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (ACTIVE_ORDER_STATUSES.includes(parsed?.status)) {
          setOrder(parsed);
        } else {
          localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
          setOrder(null);
        }
      }
    } catch {
      // Ignore invalid local storage payloads.
    }
  }, [location.state]);

  useEffect(() => {
    const fetchLatest = async () => {
      setLoading(true);
      try {
        if (isAuthenticated) {
          const { data } = await orderApi.getMine();
          const fallback = pickNewestRelevantOrder(data);
          if (!fallback) {
            setOrder(null);
            localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
            return;
          }

          if (order?._id) {
            const exact = data.find((entry) => entry._id === order._id);
            if (exact) {
              if (ACTIVE_ORDER_STATUSES.includes(exact.status)) {
                setOrder(exact);
                localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(exact));
              } else {
                setOrder(null);
                localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
              }
              return;
            }
          }

          setOrder(fallback);
          localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(fallback));
          return;
        }

        if (!order?._id) return;

        const { data } = await orderApi.getTracking(order._id);
        if (ACTIVE_ORDER_STATUSES.includes(data?.status)) {
          setOrder(data);
          localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(data));
        } else {
          setOrder(null);
          localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
        }
      } catch {
        // Keep the latest known snapshot.
      } finally {
        setLoading(false);
      }
    };

    fetchLatest();
    const intervalId = setInterval(fetchLatest, 15000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, order?._id]);

  const timer = useOrderTimer(
    order
      ? {
          createdAt: order.createdAt,
          estimatedReadyAt: order.estimatedReadyAt,
        }
      : null
  );

  const progress = getStageProgress(order, timer);
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (progress / 100) * circumference;
  const etaWindow = getEtaWindow(timer, order);
  const meta = STATUS_META[order?.status] || STATUS_META.pending;
  const subtitle = order?.status === "ready-for-pickup"
    ? order?.deliveryType === "pickup"
      ? "Deine Bestellung ist bereit zur Abholung."
      : "Deine Bestellung ist bereit und wird gleich an den Lieferdienst uebergeben."
    : meta.subtitle;
  const orderPin = getOrderPin(order);

  const stepIndex = useMemo(() => {
    if (!order) return 1;
    if (order.status === "completed") return 4;
    if (order.status === "out-for-delivery" || order.status === "ready-for-pickup") return 3;
    if (order.status === "preparing") return 2;
    return 1;
  }, [order]);

  if (!order && !loading) {
    return (
      <section className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">Kein offener Auftrag</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Order-Tracking ist nur waehrend einer laufenden Bestellung verfuegbar.</p>
        <div className="mt-5 flex justify-center">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-700 to-red-700 px-5 py-3 text-sm font-bold text-white"
          >
            Zur Speisekarte
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="overflow-hidden rounded-[2rem] border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-5 shadow-xl dark:border-slate-700 dark:from-slate-900 dark:to-slate-950"
      >
        <div className="rounded-2xl bg-[radial-gradient(circle_at_top_left,_#e2e8f0,_#f8fafc)] p-3 dark:bg-[radial-gradient(circle_at_top_left,_#334155,_#0f172a)]">
          <div className="relative mx-auto flex h-[260px] w-[260px] items-center justify-center">
            <svg width="260" height="260" viewBox="0 0 260 260" className="-rotate-90">
              <circle cx="130" cy="130" r={radius} stroke="currentColor" strokeWidth="16" className="text-slate-200 dark:text-slate-700" fill="none" />
              <circle
                cx="130"
                cy="130"
                r={radius}
                stroke="currentColor"
                strokeWidth="16"
                strokeLinecap="round"
                fill="none"
                className={timer.isOverdue ? "text-red-500" : "text-amber-500"}
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>

            <div className="absolute inset-7 rounded-full border border-slate-200 bg-white/95 p-4 text-center shadow-inner dark:border-slate-700 dark:bg-slate-900/95">
              <p className="mt-4 text-5xl font-black leading-none text-slate-900 dark:text-slate-100">{etaWindow}</p>
              <p className="mt-2 text-lg font-bold text-slate-700 dark:text-slate-300">Minuten</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {order?.status === "ready-for-pickup"
                  ? order?.deliveryType === "pickup"
                    ? "bis zur Abholung"
                    : "bis zur Uebergabe + Lieferung"
                  : order?.status === "out-for-delivery"
                    ? "bis zur Lieferung"
                    : order?.deliveryType === "pickup"
                      ? "bis zur Abholung"
                      : "verbleibend bis zur Lieferung"}
              </p>
              <p className="mt-3 inline-flex items-center gap-1 rounded-full border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                <Clock3 size={14} /> Live {timer.label}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 text-center">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
            {order?.deliveryType === "pickup" ? "ABHOLUNG" : "LIEFERUNG"}
          </p>
          <h1 className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">{meta.title}</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{subtitle}</p>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{order?.orderNumber || `#${String(order?._id || "").slice(-6)}`}</span>
            <span>{Number(order?.totalPrice || 0).toFixed(2)} EUR</span>
          </div>
          <div className="mt-2 rounded-xl bg-slate-900 px-4 py-3 text-white dark:bg-slate-950">
            <p className="text-xs font-semibold text-slate-300">Liefer-Code</p>
            <p className="text-4xl font-black leading-none tracking-wide">{orderPin}</p>
            <p className="mt-1 text-xs text-slate-300">Der Kurier fragt nach diesem Code.</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {STEP_ITEMS.map((entry, index) => {
            const active = index + 1 <= stepIndex;
            const Icon = entry.icon;

            return (
              <div
                key={entry.key}
                className={`rounded-xl border p-2 text-center ${
                  active
                    ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
                    : "border-slate-200 bg-white text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-500"
                }`}
              >
                <Icon size={16} className="mx-auto" />
                <p className="mt-1 text-[11px] font-semibold">{entry.label}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <Home size={16} /> Startseite
          </Link>
          <Link
            to="/profile"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-700 to-red-700 px-3 py-2.5 text-sm font-bold text-white"
          >
            Bestellung ansehen
          </Link>
        </div>
      </motion.section>
    </div>
  );
};

export default OrderTrackingPage;
