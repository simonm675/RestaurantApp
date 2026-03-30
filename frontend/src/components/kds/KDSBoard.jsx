import { useEffect, useMemo, useRef, useState } from "react";
import KDSOrderCard from "./KDSOrderCard";

const NEW_WINDOW_MS = 3 * 60 * 1000;

const getOrderAgeMs = (order) => Date.now() - new Date(order.createdAt).getTime();
const isNewPending = (order) => order.status === "pending" && getOrderAgeMs(order) <= NEW_WINDOW_MS;

const sortOldestFirst = (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();

const KDSBoard = ({
  orders,
  isConnected,
  isOfflineMode,
  rushHourMode,
  onToggleRushHour,
  onToggleFullscreen,
  actionLocks,
  clickFlashId,
  onStart,
  onFinish,
  onHandOver,
}) => {
  const [now, setNow] = useState(Date.now());
  const neuColumnRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const grouped = useMemo(() => {
    const neu = orders.filter((order) => order.status === "pending").sort(sortOldestFirst);
    const inProgress = orders.filter((order) => order.status === "preparing").sort(sortOldestFirst);
    const ready = orders
      .filter((order) => order.status === "ready-for-pickup")
      .sort(sortOldestFirst);
    const inDelivery = orders
      .filter((order) => order.status === "out-for-delivery")
      .sort(sortOldestFirst);

    return { neu, inProgress, ready, inDelivery };
  }, [orders]);

  const newCount = useMemo(() => grouped.neu.filter(isNewPending).length, [grouped.neu]);

  useEffect(() => {
    if (!neuColumnRef.current || newCount === 0) return;
    neuColumnRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [newCount]);

  const compact = rushHourMode || orders.length >= 18;

  const columns = [
    {
      key: "new",
      title: "New",
      count: grouped.neu.length,
      orders: grouped.neu,
      accent: "bg-red-500",
      emptyText: "Keine neuen Bestellungen",
    },
    {
      key: "in-progress",
      title: "In progress",
      count: grouped.inProgress.length,
      orders: grouped.inProgress,
      accent: "bg-amber-500",
      emptyText: "Keine laufenden Bestellungen",
    },
    {
      key: "ready",
      title: "Ready",
      count: grouped.ready.length,
      orders: grouped.ready,
      accent: "bg-emerald-500",
      emptyText: "Nichts abholbereit",
    },
    {
      key: "in-delivery",
      title: "In delivery",
      count: grouped.inDelivery.length,
      orders: grouped.inDelivery,
      accent: "bg-sky-500",
      emptyText: "Keine laufenden Lieferungen",
    },
  ];

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-[#f4f4f5] p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Active orders</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isConnected
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
              }`}
            >
              {isConnected ? "Open" : "Getrennt"}
            </span>
            {isOfflineMode && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                Offline-Modus aktiv
              </span>
            )}
            <button
              type="button"
              onClick={onToggleRushHour}
              className="min-h-11 rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
            >
              Rush Hour {compact ? "AN" : "AUS"}
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="min-h-11 rounded-xl bg-slate-900 px-4 py-2 text-sm font-extrabold text-white"
            >
              Vollbild
            </button>
          </div>
        </div>
        {newCount > 0 && (
          <p className="mt-3 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-bold text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-200">
            🔔 {newCount} neue Bestellung{newCount > 1 ? "en" : ""} warten auf Start
          </p>
        )}
      </header>

      <section className="grid gap-3 xl:grid-cols-4">
        {columns.map((column) => (
          <div key={column.key} className="rounded-2xl border border-slate-200 bg-slate-100/90 p-2 dark:border-slate-700 dark:bg-slate-900/70">
            <div className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{column.title}</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span className={`h-1.5 w-1.5 rounded-full ${column.accent}`} />
                  {column.count}
                </span>
              </div>
            </div>

            <div
              ref={column.key === "new" ? neuColumnRef : null}
              className={`space-y-3 overflow-y-auto px-0.5 ${compact ? "max-h-[58vh]" : "max-h-[66vh]"}`}
            >
              {column.orders.map((order) => (
                <KDSOrderCard
                  key={order._id}
                  order={order}
                  now={now}
                  compact={compact}
                  highlightNew={column.key === "new" ? isNewPending(order) : false}
                  actionLocked={Boolean(actionLocks[order._id])}
                  clickFlash={clickFlashId === order._id}
                  onStart={onStart}
                  onFinish={onFinish}
                  onHandOver={onHandOver}
                />
              ))}
              {column.orders.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                  {column.emptyText}
                </p>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default KDSBoard;

