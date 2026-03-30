import { CalendarDays, Home, Menu, ShoppingBag, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { orderApi } from "../services/api";
import { useUI } from "../context/UIContext";

const ACTIVE_ORDER_STATUSES = ["pending", "preparing", "ready-for-pickup", "out-for-delivery"];
const LAST_ORDER_STORAGE_KEY = "restaurantLastPlacedOrder";

const MobileBottomNav = () => {
  const { totals } = useCart();
  const { openCartDrawer } = useUI();
  const { isAuthenticated, isAdmin } = useAuth();
  const { t } = useLanguage();
  const [hasOpenOrder, setHasOpenOrder] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadOpenOrderState = async () => {
      if (isAuthenticated) {
        try {
          const { data } = await orderApi.getMine();
          if (!isMounted) return;
          const hasActive = Array.isArray(data)
            && data.some((entry) => ACTIVE_ORDER_STATUSES.includes(entry?.status));
          setHasOpenOrder(hasActive);
        } catch {
          if (isMounted) setHasOpenOrder(false);
        }
        return;
      }

      try {
        const saved = localStorage.getItem(LAST_ORDER_STORAGE_KEY);
        if (!saved) {
          if (isMounted) setHasOpenOrder(false);
          return;
        }

        const parsed = JSON.parse(saved);
        if (!parsed?._id) {
          localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
          if (isMounted) setHasOpenOrder(false);
          return;
        }

        const { data } = await orderApi.getTracking(parsed._id);
        if (!isMounted) return;

        if (ACTIVE_ORDER_STATUSES.includes(data?.status)) {
          setHasOpenOrder(true);
          localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(data));
        } else {
          setHasOpenOrder(false);
          localStorage.removeItem(LAST_ORDER_STORAGE_KEY);
        }
      } catch {
        if (isMounted) setHasOpenOrder(false);
      }
    };

    loadOpenOrderState();
    const intervalId = setInterval(loadOpenOrderState, 20000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isAuthenticated]);

  const navItemCount = useMemo(() => {
    let count = 4;
    if (totals.count > 0) count += 1;
    if (hasOpenOrder) count += 1;
    if (isAdmin) count += 1;
    return count;
  }, [hasOpenOrder, totals.count, isAdmin]);

  const itemClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
      isActive ? "text-amber-700" : "text-slate-500"
    }`;

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden dark:border-slate-700 dark:bg-slate-900/95">
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${navItemCount}, minmax(0, 1fr))` }}>
        <NavLink to="/" className={itemClass}>
          <Home size={18} />
          Home
        </NavLink>
        <NavLink to="/menu" className={itemClass}>
          <Menu size={18} />
          Menü
        </NavLink>
        <NavLink to="/reservierung" className={itemClass}>
          <CalendarDays size={18} />
          Tisch
        </NavLink>

        {totals.count > 0 && (
          <button
            type="button"
            onClick={openCartDrawer}
            className="relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500"
          >
            <ShoppingBag size={18} />
            {totals.count > 0 && (
              <span className="absolute right-3 top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
                {totals.count}
              </span>
            )}
          </button>
        )}

        {hasOpenOrder && (
          <NavLink to="/order-tracking" className={itemClass}>
            <ShoppingBag size={18} />
            Tracking
          </NavLink>
        )}

        {isAdmin && (
          <NavLink to="/admin" className={itemClass}>
            <ShoppingBag size={18} />
            Admin
          </NavLink>
        )}

        <NavLink to={isAuthenticated ? "/profile" : "/login"} className={itemClass}>
          <User size={18} />
          {isAuthenticated ? t("profile") : t("login")}
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;

