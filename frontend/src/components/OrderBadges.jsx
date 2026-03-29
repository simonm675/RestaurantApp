const statusMeta = {
  pending: {
    label: "Neu",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  },
  preparing: {
    label: "In Zubereitung",
    className: "bg-amber-100 text-amber-800 dark:bg-red-950/20 dark:text-amber-200",
  },
  "ready-for-pickup": {
    label: "Bereit zur Abholung",
    className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  },
  "out-for-delivery": {
    label: "Unterwegs",
    className: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  },
  completed: {
    label: "Abgeschlossen",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
  },
  cancelled: {
    label: "Storniert",
    className: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  },
};

const priorityMeta = {
  low: {
    label: "niedrig",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  },
  normal: {
    label: "normal",
    className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200",
  },
  high: {
    label: "hoch",
    className: "bg-amber-100 text-amber-700 dark:bg-red-950/20 dark:text-amber-200",
  },
  urgent: {
    label: "dringend",
    className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200",
  },
};

const deliveryTypeMeta = {
  delivery: {
    label: "Lieferung",
    className: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200",
  },
  pickup: {
    label: "Abholung",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-200",
  },
};

const badgeBase = "rounded-full px-2.5 py-1 text-xs font-semibold";

export const StatusBadge = ({ status }) => {
  const meta = statusMeta[status] || {
    label: status || "unbekannt",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  };

  return <span className={`${badgeBase} ${meta.className}`}>{meta.label}</span>;
};

export const PriorityBadge = ({ priority = "normal" }) => {
  const meta = priorityMeta[priority] || priorityMeta.normal;
  return <span className={`${badgeBase} ${meta.className}`}>{meta.label}</span>;
};

export const DeliveryTypeBadge = ({ deliveryType }) => {
  const meta = deliveryTypeMeta[deliveryType] || {
    label: deliveryType || "-",
    className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  };

  return <span className={`${badgeBase} ${meta.className}`}>{meta.label}</span>;
};

export const describeOrderProgress = (order) => {
  if (order.status === "pending") return "Bestellung ist eingegangen und wartet auf Zubereitung.";
  if (order.status === "preparing") return "Die Kueche bereitet deine Bestellung gerade zu.";
  if (order.status === "ready-for-pickup") return "Deine Bestellung liegt zur Abholung bereit.";
  if (order.status === "out-for-delivery") return "Deine Bestellung ist auf dem Weg zu dir.";
  if (order.status === "completed") return "Bestellung abgeschlossen.";
  if (order.status === "cancelled") return "Bestellung wurde storniert.";
  return "Status wird aktualisiert.";
};



