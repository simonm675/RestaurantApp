import { Moon, ShoppingCart, Sun, Globe } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { useUI } from "../context/UIContext";
import pizzeriaLogo from "../assets/pizzeria-uno-logo.svg";

const Navbar = ({ theme, onToggleTheme }) => {
  const { totals } = useCart();
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { openCartDrawer } = useUI();

  const navItems = [
    { to: "/", label: t("home") },
    { to: "/menu", label: t("menu") },
    { to: "/profile", label: t("profile") },
  ];

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
          <button
            onClick={toggleLanguage}
            className="rounded-lg border-2 border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 hover:border-amber-300 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-amber-600"
            aria-label={`Sprache wechseln (aktuell: ${language})`}
            title={language === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
          >
            <Globe size={18} />
          </button>

          <button
            onClick={onToggleTheme}
            className="rounded-lg border-2 border-slate-200 p-2 text-slate-700 transition hover:bg-slate-100 hover:border-amber-300 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800 dark:hover:border-amber-600"
            aria-label="Theme wechseln"
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

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

          {isAuthenticated ? (
            <button
              onClick={logout}
              className="rounded-lg bg-gradient-to-r from-amber-700 to-red-700 px-4 py-2 text-sm font-bold text-white transition hover:shadow-lg hover:from-amber-800 hover:to-red-800"
            >
              {t("logout")}
            </button>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-gradient-to-r from-amber-700 to-red-700 px-4 py-2 text-sm font-bold text-white transition hover:shadow-lg hover:from-amber-800 hover:to-red-800"
            >
              {t("login")}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;



