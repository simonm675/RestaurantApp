import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useUI } from "../context/UIContext";

const MIN_ORDER_VALUE = 20;

const CartDrawer = () => {
  const { isCartDrawerOpen, closeCartDrawer } = useUI();
  const { cartItems, totals, updateQuantity, removeFromCart } = useCart();

  const remainingForMinOrder = Math.max(0, MIN_ORDER_VALUE - totals.subtotal);
  const progress = Math.min(100, (totals.subtotal / MIN_ORDER_VALUE) * 100);

  return (
    <AnimatePresence>
      {isCartDrawerOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-slate-950/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCartDrawer}
          />

          <motion.aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
              <div>
                <p className="text-lg font-black text-slate-900 dark:text-slate-100">Warenkorb</p>
                <p className="text-xs text-slate-500">{totals.count} Artikel</p>
              </div>
              <button
                type="button"
                onClick={closeCartDrawer}
                className="rounded-xl border border-slate-300 p-2 text-slate-700 dark:border-slate-600 dark:text-slate-200"
                aria-label="Warenkorb schließen"
              >
                <X size={18} />
              </button>
            </div>

            <div className="border-b border-slate-200 px-5 py-3 dark:border-slate-700">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {remainingForMinOrder > 0
                  ? `Noch ${remainingForMinOrder.toFixed(2)} € bis Mindestbestellwert`
                  : "Mindestbestellwert erreicht"}
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-600 to-red-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {cartItems.length === 0 && (
                <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
                  Dein Warenkorb ist leer. Tippe auf + bei einem Gericht.
                </p>
              )}

              {cartItems.map((item) => (
                <motion.article
                  layout
                  key={item.cartLineId || item._id}
                  className="rounded-2xl border border-slate-200 p-3 dark:border-slate-700"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      loading="lazy"
                      className="h-16 w-16 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                      <p className="text-xs text-slate-500">{Number(item.unitPrice ?? item.price).toFixed(2)} €</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartLineId || item._id)}
                      className="text-xs font-semibold text-red-600"
                    >
                      Entfernen
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartLineId || item._id, item.quantity - 1)}
                      className="rounded-full border border-slate-300 p-1.5 dark:border-slate-600"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.cartLineId || item._id, item.quantity + 1)}
                      className="rounded-full border border-slate-300 p-1.5 dark:border-slate-600"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </motion.article>
              ))}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-700">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-300">Zwischensumme</span>
                <span className="font-semibold">{totals.subtotal.toFixed(2)} €</span>
              </div>
              <div className="mb-4 flex items-center justify-between text-base font-black text-slate-900 dark:text-slate-100">
                <span>Gesamt</span>
                <span>{totals.total.toFixed(2)} €</span>
              </div>

              <Link
                to="/checkout"
                onClick={closeCartDrawer}
                className="block rounded-xl bg-gradient-to-r from-amber-700 to-red-700 px-4 py-3 text-center text-sm font-bold text-white"
              >
                Jetzt bestellen
              </Link>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
