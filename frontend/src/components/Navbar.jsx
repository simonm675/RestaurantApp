import { ShoppingCart, Globe, User } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { orderApi } from "../services/api";
import { useUI } from "../context/UIContext";
import pizzeriaLogo from "../assets/pizzeria-uno-logo.svg";

const ACTIVE_ORDER_STATUSES = ["pending", "preparing", "ready-for-pickup", "out-for-delivery"];

const Navbar = () => {
  const { totals } = useCart();
  const { isAuthenticated, isAdmin } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const { openCartDrawer } = useUI();
  const [hasOpenOrder, setHasOpenOrder] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setHasOpenOrder(false);
      return;
    }

    let isMounted = true;

    const loadOpenOrderState = async () => {
      try {
        const { data } = await orderApi.getMine();
        if (!isMounted) return;
        const hasActive = Array.isArray(data)
          && data.some((entry) => ACTIVE_ORDER_STATUSES.includes(entry?.status));
        setHasOpenOrder(hasActive);
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

  const navItems = useMemo(() => ([
    { to: "/", label: t("home") },
    { to: "/menu", label: t("menu") },
    ...(isAuthenticated ? [{ to: "/profile", label: t("profile") }] : []),
    ...(isAuthenticated && hasOpenOrder ? [{ to: "/order-tracking", label: "Tracking" }] : []),
  ]), [hasOpenOrder, isAuthenticated, t]);

  const linkClasses = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-semibold transition ${
      isActive
        ? "bg-gradient-to-r from-amber-700 to-red-700 text-white shadow-md"
        : "text-slate-600 hover:text-amber-700 hover:bg-amber-50 dark:text-slate-200 dark:hover:text-amber-400 dark:hover:bg-amber-950/20"
    }`;

  return (
    <header className="sticky top-0 z-20 border-b border-amber-200/30 bg-white/80 backdrop-blur-2xl dark:border-amber-900/20 dark:bg-slate-950/90">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center gap-3.5 rounded-2xl bg-white/85 px-2.5 py-2 shadow-md ring-1 ring-amber-700/20 dark:bg-slate-900/85 dark:ring-amber-700/30">
          <img
            src={pizzeriaLogo}
            alt="Pizzeria Uno"
            className="h-16 w-auto rounded-lg border border-amber-700/35 bg-white p-1.5 shadow sm:h-20"
          />
          <span className="hidden bg-gradient-to-r from-amber-700 to-red-700 bg-clip-text text-3xl font-black tracking-tight text-transparent lg:block">
            Pizzeria Uno
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} className={linkClasses}>
              {item.label}
            </NavLink>
          ))}
          {isAdmin && (
            <>
              <NavLink to="/admin" className={linkClasses}>
                👨‍💼 {t("admin")}
              </NavLink>
            </>
          )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border-2 border-slate-200 bg-white px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900">
            <Globe size={16} className="text-slate-600 dark:text-slate-300" />
            <label className="sr-only" htmlFor="language-select">
              {t("chooseLanguage")}
            </label>
            <select
              id="language-select"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 outline-none dark:text-slate-200"
              aria-label={t("chooseLanguage")}
            >
              <option value="de">DE</option>
              <option value="en">EN</option>
            </select>
          </div>

          {totals.count > 0 && (
            <button
              type="button"
              onClick={openCartDrawer}
              className="relative inline-flex h-10 min-w-12 px-3 items-center justify-center rounded-xl border-2 border-slate-200 text-slate-700 transition hover:bg-slate-100 hover:border-amber-300 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-amber-600"
              aria-label={t("cart")}
            >
              <ShoppingCart size={19} strokeWidth={2.1} />
              {totals.count > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-gradient-to-r from-amber-700 to-red-700 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                  {totals.count}
                </span>
              )}
            </button>
          )}

          {isAuthenticated ? (
            <NavLink to="/profile" className={({ isActive }) => `hidden lg:flex rounded-lg border-2 border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 hover:border-amber-300 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-amber-600 ${isActive ? "bg-amber-100 dark:bg-amber-950/30" : ""}`} aria-label={t("profile")} title={t("profile")}>
              <User size={18} />
            </NavLink>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg border-2 border-amber-300 px-4 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
              >
                {t("login")}
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-gradient-to-r from-amber-700 to-red-700 px-4 py-2 text-sm font-bold text-white transition hover:shadow-lg hover:from-amber-800 hover:to-red-800"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;




