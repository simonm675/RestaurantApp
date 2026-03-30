import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";

const CartPage = () => {
  const { cartItems, totals, removeFromCart, updateQuantity } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Dein Warenkorb ist leer</h2>
        <p className="mt-2 text-slate-600 dark:text-slate-300">Fuege im Menue ein paar Highlights hinzu.</p>
        <Link to="/menu" className="mt-5 inline-block rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white hover:bg-amber-600">
          Zum Menue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        {cartItems.map((item) => (
          <article key={item.cartLineId || item._id} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900">
            <img src={item.image} alt={item.name} className="h-24 w-24 rounded-2xl object-cover" />
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300">{Number(item.unitPrice ?? item.price).toFixed(2)} EUR</p>
              {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
                <ul className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.selectedOptions.map((option, index) => (
                    <li key={`${item.cartLineId || item._id}-opt-${index}`}>
                      + {option.label}: {option.value} {option.price > 0 ? `(+${Number(option.price).toFixed(2)} EUR)` : ""}
                    </li>
                  ))}
                </ul>
              )}
              {item.specialInstructions && (
                <p className="text-xs italic text-slate-500 dark:text-slate-400">Hinweis: {item.specialInstructions}</p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.cartLineId || item._id, item.quantity - 1)}
                className="h-9 w-9 rounded-full border border-slate-300 text-slate-800 dark:border-slate-600 dark:text-slate-100"
              >
                -
              </button>
              <span className="w-8 text-center font-semibold text-slate-900 dark:text-slate-100">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.cartLineId || item._id, item.quantity + 1)}
                className="h-9 w-9 rounded-full border border-slate-300 text-slate-800 dark:border-slate-600 dark:text-slate-100"
              >
                +
              </button>
            </div>

            <button
              onClick={() => removeFromCart(item.cartLineId || item._id)}
              className="rounded-xl border border-red-200 px-3 py-2 text-xs font-bold uppercase tracking-wide text-red-600 hover:bg-red-50"
            >
              Entfernen
            </button>
          </article>
        ))}
      </section>

      <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Gesamtsumme</h3>
        <div className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex justify-between">
            <span>Zwischensumme</span>
            <span>{totals.subtotal.toFixed(2)} EUR</span>
          </div>
          <div className="flex justify-between">
            <span>Liefergebuehr</span>
            <span>{totals.deliveryFee.toFixed(2)} EUR</span>
          </div>
          <div className="mt-3 flex justify-between text-base font-bold text-slate-900 dark:text-slate-100">
            <span>Total</span>
            <span>{totals.total.toFixed(2)} EUR</span>
          </div>
        </div>
        <Link
          to="/checkout"
          className="mt-5 block rounded-full bg-slate-900 px-4 py-3 text-center text-sm font-bold text-white hover:bg-amber-600"
        >
          Weiter zum Checkout
        </Link>
      </aside>
    </div>
  );
};

export default CartPage;




