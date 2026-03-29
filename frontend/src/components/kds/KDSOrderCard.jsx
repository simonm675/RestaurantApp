import { memo } from "react";
import useOrderTimer from "../../hooks/useOrderTimer";

const KDSOrderCard = ({
  order,
  now,
  compact,
  highlightNew,
  actionLocked,
  clickFlash,
  onStart,
  onFinish,
}) => {
  const timer = useOrderTimer(order.createdAt, now);
  const orderLabel = order.orderNumber || `#${String(order._id || "").slice(-6)}`;

  const finishLabel = order.deliveryType === "pickup" ? "Fertig" : "Übergabe";

  return (
    <article
      className={`rounded-2xl border p-3 shadow-sm transition ${
        highlightNew
          ? "border-red-400 bg-red-50 ring-2 ring-red-300/70 dark:border-red-600 dark:bg-red-950/20 dark:ring-red-700/60 animate-pulse"
          : timer.level === "critical"
            ? "border-red-300 bg-red-50/70 dark:border-red-700 dark:bg-red-950/10"
            : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
      } ${clickFlash ? "ring-2 ring-emerald-400" : ""}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-2xl font-black leading-none text-slate-900 dark:text-slate-100">{orderLabel}</p>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${timer.badgeClass}`}>
          {timer.label}
        </span>
      </div>

      <div className="mb-2 flex items-center gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-2 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {order.deliveryType === "pickup" ? "Abholung" : "Lieferung"}
        </span>
        {highlightNew && (
          <span className="rounded-full bg-red-600 px-2 py-1 font-bold text-white">NEU</span>
        )}
      </div>

      <ul className={`space-y-1 ${compact ? "text-sm" : "text-base"} font-semibold text-slate-900 dark:text-slate-100`}>
        {order.items.map((item, index) => (
          <li key={`${order._id}-${item.menuItem}-${index}`} className="rounded-lg bg-slate-50 px-2 py-1 dark:bg-slate-800/70">
            <p>
              x{item.quantity} {item.name}
            </p>
            {item.specialInstructions && (
              <p className="mt-0.5 rounded bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-200">
                {item.specialInstructions}
              </p>
            )}
            {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
              <p className="mt-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                {item.selectedOptions.map((option) => `${option.label}: ${option.value}`).join(" | ")}
              </p>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {order.status === "pending" ? (
          <button
            type="button"
            disabled={actionLocked}
            onClick={() => onStart(order)}
            className="min-h-11 rounded-xl bg-amber-500 px-3 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            Start
          </button>
        ) : (
          <span className="min-h-11 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
            In Zubereitung
          </span>
        )}

        {order.status === "preparing" ? (
          <button
            type="button"
            disabled={actionLocked}
            onClick={() => onFinish(order)}
            className="min-h-11 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {finishLabel}
          </button>
        ) : (
          <span className="min-h-11 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {order.status === "pending" ? "Warten" : "Fertig"}
          </span>
        )}
      </div>
    </article>
  );
};

export default memo(KDSOrderCard);
