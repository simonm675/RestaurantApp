import { Home, Menu, ShoppingBag, User } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";

const MobileBottomNav = () => {
  const { totals } = useCart();
  const { openCartDrawer } = useUI();

  const itemClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
      isActive ? "text-amber-700" : "text-slate-500"
    }`;

  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white/95 p-2 shadow-xl backdrop-blur lg:hidden dark:border-slate-700 dark:bg-slate-900/95">
      <div className="grid grid-cols-4 gap-1">
        <NavLink to="/" className={itemClass}>
          <Home size={18} />
          Home
        </NavLink>
        <NavLink to="/menu" className={itemClass}>
          <Menu size={18} />
          Menü
        </NavLink>

        <button
          type="button"
          onClick={openCartDrawer}
          className="relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500"
        >
          <ShoppingBag size={18} />
          Warenkorb
          {totals.count > 0 && (
            <span className="absolute right-3 top-1 rounded-full bg-red-600 px-1.5 text-[10px] font-bold text-white">
              {totals.count}
            </span>
          )}
        </button>

        <NavLink to="/profile" className={itemClass}>
          <User size={18} />
          Profil
        </NavLink>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
