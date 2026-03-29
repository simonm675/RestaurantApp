import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../services/api";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { auth, isAuthenticated } = useAuth();
  const { cartItems, totals, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [addressMode, setAddressMode] = useState("manual");
  const [formData, setFormData] = useState({
    address: "",
    customerPhone: "",
    deliveryNotes: "",
    deliveryType: "delivery",
    paymentMethod: "card",
  });

  const profileAddress = useMemo(() => {
    const parts = [
      [auth?.address?.street, auth?.address?.houseNumber].filter(Boolean).join(" ").trim(),
      [auth?.address?.postalCode, auth?.address?.city].filter(Boolean).join(" ").trim(),
    ].filter(Boolean);
    return parts.join(", ");
  }, [auth?.address]);

  const hasProfileAddress = profileAddress.trim().length > 0;

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      address: hasProfileAddress ? profileAddress : prev.address,
      customerPhone: auth?.phone || prev.customerPhone,
      deliveryNotes: auth?.deliveryNotes || prev.deliveryNotes,
      deliveryType: auth?.preferredDeliveryType || prev.deliveryType,
      paymentMethod: auth?.preferredPaymentMethod || prev.paymentMethod,
    }));

    setAddressMode(hasProfileAddress ? "profile" : "manual");
  }, [
    auth?.phone,
    auth?.deliveryNotes,
    auth?.preferredDeliveryType,
    auth?.preferredPaymentMethod,
    hasProfileAddress,
    profileAddress,
  ]);

  const checkoutDeliveryFee = formData.deliveryType === "delivery" ? totals.deliveryFee : 0;
  const checkoutTotal = totals.subtotal + checkoutDeliveryFee;

  const onChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Dein Warenkorb ist leer");
      return;
    }

    if (formData.deliveryType === "delivery" && !formData.address.trim()) {
      toast.error("Bitte Lieferadresse eingeben");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        items: cartItems.map((item) => ({
          menuItem: item._id,
          name: item.name,
          price: Number(item.unitPrice ?? item.price),
          quantity: item.quantity,
          image: item.image,
          selectedOptions: item.selectedOptions || [],
          specialInstructions: item.specialInstructions || "",
        })),
        address: formData.address,
        customerPhone: formData.customerPhone,
        deliveryNotes: formData.deliveryNotes,
        deliveryType: formData.deliveryType,
        paymentMethod: formData.paymentMethod,
      };

      await orderApi.create(payload);
      toast.success("Bestellung erfolgreich aufgegeben");
      clearCart();
      navigate("/profile");
    } catch (error) {
      toast.error(error.response?.data?.message || "Checkout fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-6 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-red-950/10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">🛒 Checkout</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Schnell bezahlen in unter 1 Minute</p>
        {!isAuthenticated && (
          <p className="mt-2 rounded-xl bg-amber-100 px-3 py-2 text-xs font-semibold text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
            Gast-Checkout aktiv: Du kannst ohne Konto bestellen.
          </p>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Delivery Type Selection */}
        <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-3">📍 Lieferart wählen</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {["delivery", "pickup"].map((type) => (
              <label
                key={type}
                onClick={() => setFormData((prev) => ({ ...prev, deliveryType: type }))}
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition ${
                  formData.deliveryType === type
                    ? "border-amber-500 bg-red-50 dark:border-amber-400 dark:bg-red-950/20"
                    : "border-slate-200 hover:border-amber-300 dark:border-slate-700 dark:hover:border-amber-600"
                }`}
              >
                <input type="radio" name="deliveryType" value={type} className="hidden" />
                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${formData.deliveryType === type ? "border-amber-600 bg-red-700" : "border-slate-300"}`}>
                    {formData.deliveryType === type && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{type === "delivery" ? "🚗 Lieferung" : "🏪 Abholung"}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{type === "delivery" ? "Liefern lassen" : "Selbst abholen"}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </section>

        {/* Delivery Address */}
        {formData.deliveryType === "delivery" && (
          <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-3">📮 Lieferadresse</h3>

            {isAuthenticated && hasProfileAddress && (
              <div className="mb-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => {
                    setAddressMode("profile");
                    setFormData((prev) => ({ ...prev, address: profileAddress }));
                  }}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-sm transition ${
                    addressMode === "profile"
                      ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-950/30 dark:text-amber-200"
                      : "border-slate-200 text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  <p className="font-semibold">Profiladresse verwenden</p>
                  <p className="mt-0.5 text-xs opacity-90">{profileAddress}</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAddressMode("manual");
                    setFormData((prev) => ({ ...prev, address: "" }));
                  }}
                  className={`rounded-xl border-2 px-3 py-2 text-left text-sm transition ${
                    addressMode === "manual"
                      ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-950/30 dark:text-amber-200"
                      : "border-slate-200 text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:text-slate-300"
                  }`}
                >
                  <p className="font-semibold">Andere Adresse eingeben</p>
                  <p className="mt-0.5 text-xs opacity-90">z.B. Arbeit, Freunde oder Hotel</p>
                </button>
              </div>
            )}

            <label className="block space-y-2">
              <textarea
                name="address"
                value={formData.address}
                onChange={onChange}
                required
                autoComplete="street-address"
                placeholder="Straße, Hausnummer, PLZ, Ort und evtl. Tür/Apartment-Nummer"
                rows={3}
                disabled={isAuthenticated && hasProfileAddress && addressMode === "profile"}
                className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
              />
              {formData.address.trim() && <p className="text-xs text-green-600 dark:text-green-400">✓ Adresse erfasst</p>}
            </label>
          </section>
        )}

        {/* Contact Information */}
        <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-3">📞 Kontakt & Hinweise</h3>
          <div className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Telefon (für Rückfragen)</span>
              <input
                name="customerPhone"
                value={formData.customerPhone}
                onChange={onChange}
                autoComplete="tel"
                placeholder="+49 170 1234567"
                className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lieferhinweis (optional)</span>
              <input
                name="deliveryNotes"
                value={formData.deliveryNotes}
                onChange={onChange}
                placeholder="z.B. Klingel links, 3. Stock, beim Nachbarn klingeln..."
                className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-3">💳 Zahlungsmethode</h3>
          <select
            name="paymentMethod"
            value={formData.paymentMethod}
            onChange={onChange}
            className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="card">💳 Kreditkarte</option>
            <option value="paypal">🅿️ PayPal</option>
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Demo-Modus: Zahlungen sind nicht echt</p>
        </section>

        {/* Summary */}
        <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-red-50 p-5 dark:border-amber-600 dark:from-amber-950/30 dark:to-red-950/20">
          <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300 mb-3">📋 Bestellzusammenfassung</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-amber-200 dark:border-amber-800/50">
              <span className="text-slate-600 dark:text-slate-400">Zwischensumme</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totals.subtotal.toFixed(2)} €</span>
            </div>
            {formData.deliveryType === "delivery" && (
              <div className="flex justify-between py-2 border-b border-amber-200 dark:border-amber-800/50">
                <span className="text-slate-600 dark:text-slate-400">Lieferage bühr</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">+{checkoutDeliveryFee.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between py-3 pt-4">
              <span className="font-bold text-lg text-amber-700 dark:text-amber-300">Gesamtbetrag</span>
              <span className="font-black text-xl text-amber-700 dark:text-amber-300">{checkoutTotal.toFixed(2)} €</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keine versteckten Gebühren. Preis inkl. Liefergebühr.</p>
          </div>
        </section>

        {/* Cart Items */}
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400 mb-3">🍽️ Bestellte Gerichte</h3>
          <div className="space-y-2 rounded-2xl border-2 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            {cartItems.map((item) => (
              <div key={item.cartLineId || item._id} className="py-2 border-b border-slate-100 last:border-b-0 dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{item.quantity}x {item.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{Number(item.unitPrice ?? item.price).toFixed(2)} € pro Stück</p>
                  </div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{(Number(item.unitPrice ?? item.price) * item.quantity).toFixed(2)} €</p>
                </div>
                {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {item.selectedOptions.map((option, index) => (
                      <li key={`${item.cartLineId || item._id}-checkout-opt-${index}`}>
                        + {option.label}: {option.value} {option.price > 0 ? `(+${Number(option.price).toFixed(2)} €)` : ""}
                      </li>
                    ))}
                  </ul>
                )}
                {item.specialInstructions && (
                  <p className="mt-1 text-xs italic text-slate-500 dark:text-slate-400">Hinweis: {item.specialInstructions}</p>
                )}
              </div>
            ))}
          </div>
        </section>

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl bg-gradient-to-r from-amber-700 to-red-700 px-6 py-4 text-base font-bold text-white transition hover:shadow-lg hover:from-amber-800 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? "⏳ Verarbeite Bestellung..." : `✓ Bestellung aufgeben (${checkoutTotal.toFixed(2)} €)`}
        </motion.button>
      </form>

      <div className="sticky bottom-20 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur lg:hidden dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center justify-between text-sm">
          <p className="font-semibold">Gesamt</p>
          <p className="text-lg font-black text-amber-700 dark:text-amber-300">{checkoutTotal.toFixed(2)} €</p>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;



