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
    const preparing = orders.filter((order) => order.status === "preparing").sort(sortOldestFirst);
    const ready = orders
      .filter((order) => ["ready-for-pickup", "out-for-delivery"].includes(order.status))
      .sort(sortOldestFirst);

    return { neu, preparing, ready };
  }, [orders]);

  const newCount = useMemo(() => grouped.neu.filter(isNewPending).length, [grouped.neu]);

  useEffect(() => {
    if (!neuColumnRef.current || newCount === 0) return;
    neuColumnRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }, [newCount]);

  const compact = rushHourMode || orders.length >= 18;

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">KDS Küche</h2>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                isConnected
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
              }`}
            >
              {isConnected ? "Online" : "Getrennt"}
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

      <section className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-2xl border-2 border-red-300 bg-red-50/50 p-3 dark:border-red-800 dark:bg-red-950/20">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-red-700 dark:text-red-300">Neu</h3>
            <span className="rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">{grouped.neu.length}</span>
          </div>
          <div ref={neuColumnRef} className={`space-y-3 overflow-y-auto ${compact ? "max-h-[60vh]" : "max-h-[68vh]"}`}>
            {grouped.neu.map((order) => (
              <KDSOrderCard
                key={order._id}
                order={order}
                now={now}
                compact={compact}
                highlightNew={isNewPending(order)}
                actionLocked={Boolean(actionLocks[order._id])}
                clickFlash={clickFlashId === order._id}
                onStart={onStart}
                onFinish={onFinish}
              />
            ))}
            {grouped.neu.length === 0 && (
              <p className="rounded-xl border border-dashed border-red-300 p-4 text-sm font-semibold text-red-700 dark:border-red-700 dark:text-red-200">
                Keine neuen Bestellungen
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-amber-700 dark:text-amber-300">In Zubereitung</h3>
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">{grouped.preparing.length}</span>
          </div>
          <div className={`space-y-3 overflow-y-auto ${compact ? "max-h-[60vh]" : "max-h-[68vh]"}`}>
            {grouped.preparing.map((order) => (
              <KDSOrderCard
                key={order._id}
                order={order}
                now={now}
                compact={compact}
                highlightNew={false}
                actionLocked={Boolean(actionLocks[order._id])}
                clickFlash={clickFlashId === order._id}
                onStart={onStart}
                onFinish={onFinish}
              />
            ))}
            {grouped.preparing.length === 0 && (
              <p className="rounded-xl border border-dashed border-amber-300 p-4 text-sm font-semibold text-amber-700 dark:border-amber-700 dark:text-amber-200">
                Keine laufenden Bestellungen
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/50 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-300">Fertig</h3>
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">{grouped.ready.length}</span>
          </div>
          <div className={`space-y-3 overflow-y-auto ${compact ? "max-h-[60vh]" : "max-h-[68vh]"}`}>
            {grouped.ready.map((order) => (
              <KDSOrderCard
                key={order._id}
                order={order}
                now={now}
                compact={compact}
                highlightNew={false}
                actionLocked={Boolean(actionLocks[order._id])}
                clickFlash={clickFlashId === order._id}
                onStart={onStart}
                onFinish={onFinish}
              />
            ))}
            {grouped.ready.length === 0 && (
              <p className="rounded-xl border border-dashed border-emerald-300 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-700 dark:text-emerald-200">
                Nichts fertig
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default KDSBoard;
