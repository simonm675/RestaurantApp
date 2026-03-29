import { useEffect, useMemo, useState } from "react";

const MINUTE_MS = 60 * 1000;

const getTimerTone = (elapsedMinutes) => {
  if (elapsedMinutes > 10) {
    return {
      label: `${elapsedMinutes} min`,
      textClass: "text-red-700 dark:text-red-300",
      badgeClass: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700",
      level: "critical",
    };
  }

  if (elapsedMinutes >= 5) {
    return {
      label: `${elapsedMinutes} min`,
      textClass: "text-amber-700 dark:text-amber-300",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
      level: "warning",
    };
  }

  return {
    label: `${elapsedMinutes} min`,
    textClass: "text-slate-700 dark:text-slate-200",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
    level: "normal",
  };
};

export const useOrderTimer = (createdAt, sharedNow) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (sharedNow !== undefined) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 15000);

    return () => clearInterval(interval);
  }, [sharedNow]);

  const effectiveNow = sharedNow ?? now;

  const timer = useMemo(() => {
    if (!createdAt) {
      return {
        elapsedMinutes: 0,
        elapsedSeconds: 0,
        label: "0 min",
        textClass: "text-slate-700 dark:text-slate-200",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
        level: "normal",
      };
    }

    const elapsedMs = Math.max(0, effectiveNow - new Date(createdAt).getTime());
    const elapsedMinutes = Math.floor(elapsedMs / MINUTE_MS);
    const elapsedSeconds = Math.floor(elapsedMs / 1000);
    const tone = getTimerTone(elapsedMinutes);

    return {
      elapsedMinutes,
      elapsedSeconds,
      ...tone,
    };
  }, [createdAt, effectiveNow]);

  return timer;
};

export default useOrderTimer;
