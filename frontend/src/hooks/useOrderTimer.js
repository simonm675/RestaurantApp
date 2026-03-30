import { useEffect, useMemo, useState } from "react";

const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const formatElapsed = (elapsedSeconds) => {
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const formatHumanMinutes = (seconds) => {
  const absSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(absSeconds / 60);
  if (minutes < 1) return "<1 min";
  return `${minutes} min`;
};

const getEtaTone = ({ hasEta, remainingSeconds, isOverdue }) => {
  if (!hasEta) {
    return {
      customerBadgeClass:
        "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
      customerTone: "neutral",
      etaLabel: "ETA wird berechnet",
    };
  }

  if (isOverdue) {
    return {
      customerBadgeClass:
        "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700",
      customerTone: "critical",
      etaLabel: `+${formatHumanMinutes(Math.abs(remainingSeconds))} ueberfaellig`,
    };
  }

  if (remainingSeconds <= 10 * 60) {
    return {
      customerBadgeClass:
        "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
      customerTone: "soon",
      etaLabel: `${formatHumanMinutes(remainingSeconds)} verbleibend`,
    };
  }

  return {
    customerBadgeClass:
      "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-700",
    customerTone: "ok",
    etaLabel: `${formatHumanMinutes(remainingSeconds)} verbleibend`,
  };
};

const getTimerTone = (elapsedMinutes, elapsedSeconds) => {
  const label = formatElapsed(elapsedSeconds);

  if (elapsedMinutes > 10) {
    return {
      label,
      textClass: "text-red-700 dark:text-red-300",
      badgeClass: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/40 dark:text-red-200 dark:border-red-700",
      level: "critical",
    };
  }

  if (elapsedMinutes >= 5) {
    return {
      label,
      textClass: "text-amber-700 dark:text-amber-300",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700",
      level: "warning",
    };
  }

  return {
    label,
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
    }, 1000);

    return () => clearInterval(interval);
  }, [sharedNow]);

  const effectiveNow = sharedNow ?? now;
  const hasEtaInput = typeof createdAt === "object" && createdAt !== null;
  const createdAtValue = hasEtaInput ? createdAt.createdAt : createdAt;
  const estimatedReadyAtValue = hasEtaInput ? createdAt.estimatedReadyAt : undefined;

  const timer = useMemo(() => {
    if (!createdAtValue) {
      return {
        elapsedMinutes: 0,
        elapsedSeconds: 0,
        label: "00:00",
        remainingSeconds: null,
        progressPercent: 0,
        hasEta: false,
        isOverdue: false,
        etaLabel: "ETA wird berechnet",
        customerBadgeClass:
          "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
        customerTone: "neutral",
        textClass: "text-slate-700 dark:text-slate-200",
        badgeClass: "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600",
        level: "normal",
      };
    }

    const createdAtMs = new Date(createdAtValue).getTime();
    const elapsedMs = Math.max(0, effectiveNow - createdAtMs);
    const elapsedMinutes = Math.floor(elapsedMs / MINUTE_MS);
    const elapsedSeconds = Math.floor(elapsedMs / SECOND_MS);
    const tone = getTimerTone(elapsedMinutes, elapsedSeconds);

    const hasEta = Boolean(estimatedReadyAtValue);
    const etaMs = hasEta ? new Date(estimatedReadyAtValue).getTime() : null;
    const remainingSeconds = hasEta ? Math.ceil((etaMs - effectiveNow) / SECOND_MS) : null;
    const isOverdue = hasEta ? remainingSeconds < 0 : false;

    const prepTotalSeconds = hasEta ? Math.max(60, Math.floor((etaMs - createdAtMs) / SECOND_MS)) : 0;
    const progressPercent = hasEta
      ? clamp((elapsedSeconds / prepTotalSeconds) * 100, 2, isOverdue ? 100 : 98)
      : clamp((elapsedMinutes / 30) * 100, 2, 95);

    const etaTone = getEtaTone({ hasEta, remainingSeconds, isOverdue });

    return {
      elapsedMinutes,
      elapsedSeconds,
      remainingSeconds,
      progressPercent,
      hasEta,
      isOverdue,
      ...etaTone,
      ...tone,
    };
  }, [createdAtValue, estimatedReadyAtValue, effectiveNow]);

  return timer;
};

export default useOrderTimer;
