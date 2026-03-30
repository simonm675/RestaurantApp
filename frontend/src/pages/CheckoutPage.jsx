import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import useOrderTimer from "../hooks/useOrderTimer";
import { orderApi } from "../services/api";

const GUEST_ORDERS_STORAGE_KEY = "restaurantGuestOrders";
const LAST_ORDER_STORAGE_KEY = "restaurantLastPlacedOrder";

const createBaseForm = () => ({
  customerPhone: "",
  deliveryNotes: "",
  deliveryType: "delivery",
  paymentMethod: "card",
  guestName: "",
  guestEmail: "",
  addressStreet: "",
  addressHouseNumber: "",
  addressPostalCode: "",
  addressCity: "",
  addressFloor: "",
  addressDoorbell: "",
  addressExtra: "",
});

const buildAddressString = (formData) => {
  const mainLine = [formData.addressStreet, formData.addressHouseNumber]
    .filter(Boolean)
    .join(" ")
    .trim();

  const cityLine = [formData.addressPostalCode, formData.addressCity]
    .filter(Boolean)
    .join(" ")
    .trim();

  const extras = [
    formData.addressFloor ? `Etage ${formData.addressFloor}` : "",
    formData.addressDoorbell ? `Klingel ${formData.addressDoorbell}` : "",
    formData.addressExtra,
  ].filter(Boolean);

  return [mainLine, cityLine, ...extras].filter(Boolean).join(", ").trim();
};

const mapAuthAddressToFields = (auth) => ({
  addressStreet: auth?.address?.street || "",
  addressHouseNumber: auth?.address?.houseNumber || "",
  addressPostalCode: auth?.address?.postalCode || "",
  addressCity: auth?.address?.city || "",
});

const isValidEmail = (email) => /.+@.+\..+/.test(String(email || "").trim());

const GuestOrderTimer = ({ createdAt }) => {
  const timer = useOrderTimer(createdAt);

  const barClass = timer.isOverdue
    ? "bg-red-500"
    : timer.customerTone === "soon"
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="w-full space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${timer.badgeClass}`}>
          Live {timer.label}
        </span>
        <span className={`inline-flex rounded-full border px-2 py-1 text-[11px] font-bold ${timer.customerBadgeClass}`}>
          {timer.etaLabel}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full transition-all ${barClass}`} style={{ width: `${timer.progressPercent}%` }} />
      </div>
    </div>
  );
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { auth, isAuthenticated } = useAuth();
  const { cartItems, totals, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [addressMode, setAddressMode] = useState("manual");
  const [formData, setFormData] = useState(createBaseForm);
  const [orderConfirmation, setOrderConfirmation] = useState(null);
  const [guestOrders, setGuestOrders] = useState(() => {
    try {
      const saved = localStorage.getItem(GUEST_ORDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const profileAddress = useMemo(() => {
    const parts = [
      [auth?.address?.street, auth?.address?.houseNumber].filter(Boolean).join(" ").trim(),
      [auth?.address?.postalCode, auth?.address?.city].filter(Boolean).join(" ").trim(),
    ].filter(Boolean);
    return parts.join(", ");
  }, [auth?.address]);

  const hasProfileAddress = profileAddress.trim().length > 0;
  const manualAddress = useMemo(() => buildAddressString(formData), [formData]);

  useEffect(() => {
    const mappedAddress = mapAuthAddressToFields(auth);

    setFormData((prev) => ({
      ...prev,
      ...mappedAddress,
      customerPhone: auth?.phone || prev.customerPhone,
      deliveryNotes: auth?.deliveryNotes || prev.deliveryNotes,
      deliveryType: auth?.preferredDeliveryType || prev.deliveryType,
      paymentMethod: auth?.preferredPaymentMethod || prev.paymentMethod,
      guestName: auth?.name || prev.guestName,
      guestEmail: auth?.email || prev.guestEmail,
    }));

    setAddressMode(hasProfileAddress ? "profile" : "manual");
  }, [
    auth?.name,
    auth?.email,
    auth?.phone,
    auth?.deliveryNotes,
    auth?.preferredDeliveryType,
    auth?.preferredPaymentMethod,
    hasProfileAddress,
    profileAddress,
  ]);

  useEffect(() => {
    localStorage.setItem(GUEST_ORDERS_STORAGE_KEY, JSON.stringify(guestOrders));
  }, [guestOrders]);

  const checkoutDeliveryFee = formData.deliveryType === "delivery" ? totals.deliveryFee : 0;
  const checkoutTotal = totals.subtotal + checkoutDeliveryFee;
  const effectiveAddress = formData.deliveryType === "pickup"
    ? "Abholung vor Ort"
    : addressMode === "profile"
      ? profileAddress
      : manualAddress;

  const onChange = (event) => {
    setFormData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const onAddressFieldChange = (name) => (event) => {
    setFormData((prev) => ({ ...prev, [name]: event.target.value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (cartItems.length === 0) {
      toast.error("Dein Warenkorb ist leer");
      return;
    }

    if (formData.deliveryType === "delivery" && !effectiveAddress.trim()) {
      toast.error("Bitte Lieferadresse eingeben");
      return;
    }

    if (!isAuthenticated) {
      if (!formData.guestName.trim() || formData.guestName.trim().length < 2) {
        toast.error("Bitte Namen fuer die Gastbestellung eingeben");
        return;
      }

      if (!formData.customerPhone.trim() && !isValidEmail(formData.guestEmail)) {
        toast.error("Bitte mindestens Telefon oder gueltige E-Mail angeben");
        return;
      }
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
        address: effectiveAddress,
        customerPhone: formData.customerPhone,
        deliveryNotes: formData.deliveryNotes,
        deliveryType: formData.deliveryType,
        paymentMethod: formData.paymentMethod,
        guestName: formData.guestName,
        guestEmail: formData.guestEmail,
      };

      const { data: createdOrder } = await orderApi.create(payload);
      toast.success(`Bestellung ${createdOrder.orderNumber || ""} erfolgreich aufgegeben`);

      localStorage.setItem(LAST_ORDER_STORAGE_KEY, JSON.stringify(createdOrder));

      if (!isAuthenticated) {
        setOrderConfirmation(createdOrder);
        setGuestOrders((prev) => [
          {
            _id: createdOrder._id,
            orderNumber: createdOrder.orderNumber,
            status: createdOrder.status,
            createdAt: createdOrder.createdAt,
            estimatedReadyAt: createdOrder.estimatedReadyAt,
            totalPrice: createdOrder.totalPrice,
            deliveryType: createdOrder.deliveryType,
          },
          ...prev,
        ].slice(0, 5));
      }

      clearCart();
      navigate("/order-tracking", { state: { order: createdOrder }, replace: true });
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

      {orderConfirmation && (
        <section className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4 dark:border-emerald-700 dark:bg-emerald-950/20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">✓ Letzte Gastbestellung</h2>
            <GuestOrderTimer
              createdAt={{
                createdAt: orderConfirmation.createdAt,
                estimatedReadyAt: orderConfirmation.estimatedReadyAt,
              }}
            />
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{orderConfirmation.orderNumber || `#${String(orderConfirmation._id).slice(-6)}`}</p>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Status: {orderConfirmation.status} • Gesamt: {Number(orderConfirmation.totalPrice || 0).toFixed(2)} €</p>
        </section>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        {!isAuthenticated && (
          <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">🙋 Gastdaten</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Name</span>
                <input
                  name="guestName"
                  value={formData.guestName}
                  onChange={onChange}
                  placeholder="Vor- und Nachname"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">E-Mail (optional)</span>
                <input
                  name="guestEmail"
                  type="email"
                  value={formData.guestEmail}
                  onChange={onChange}
                  placeholder="name@example.com"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Fuer Gastbestellungen brauchen wir Name und mindestens Telefon oder E-Mail.</p>
          </section>
        )}

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
                    setFormData((prev) => ({
                      ...prev,
                      ...mapAuthAddressToFields(auth),
                    }));
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

            {addressMode === "profile" && hasProfileAddress ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-200">
                <p className="font-semibold">Aktive Profiladresse:</p>
                <p className="mt-0.5">{profileAddress}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                  <input
                    value={formData.addressStreet}
                    onChange={onAddressFieldChange("addressStreet")}
                    autoComplete="street-address"
                    placeholder="Straße"
                    required={formData.deliveryType === "delivery"}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    value={formData.addressHouseNumber}
                    onChange={onAddressFieldChange("addressHouseNumber")}
                    placeholder="Hausnummer"
                    required={formData.deliveryType === "delivery"}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-[140px_1fr]">
                  <input
                    value={formData.addressPostalCode}
                    onChange={onAddressFieldChange("addressPostalCode")}
                    placeholder="PLZ"
                    required={formData.deliveryType === "delivery"}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    value={formData.addressCity}
                    onChange={onAddressFieldChange("addressCity")}
                    placeholder="Ort"
                    required={formData.deliveryType === "delivery"}
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    value={formData.addressFloor}
                    onChange={onAddressFieldChange("addressFloor")}
                    placeholder="Etage (optional)"
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                  />
                  <input
                    value={formData.addressDoorbell}
                    onChange={onAddressFieldChange("addressDoorbell")}
                    placeholder="Klingelschild (optional)"
                    className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                  />
                </div>

                <input
                  value={formData.addressExtra}
                  onChange={onAddressFieldChange("addressExtra")}
                  placeholder="Zusatzinfo (optional)"
                  className="w-full rounded-xl border-2 border-slate-200 bg-white p-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />

                {manualAddress.trim() && (
                  <p className="text-xs text-green-600 dark:text-green-400">✓ Adresse erfasst: {manualAddress}</p>
                )}
              </div>
            )}
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

        {!isAuthenticated && guestOrders.length > 0 && (
          <section className="rounded-2xl border-2 border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">🧾 Letzte Gastbestellungen</h3>
            <div className="mt-3 space-y-2">
              {guestOrders.map((entry) => (
                <article key={entry._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{entry.orderNumber || `#${String(entry._id || "").slice(-6)}`}</p>
                    <GuestOrderTimer
                      createdAt={{
                        createdAt: entry.createdAt,
                        estimatedReadyAt: entry.estimatedReadyAt,
                      }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(entry.createdAt).toLocaleString("de-DE")} • {Number(entry.totalPrice || 0).toFixed(2)} € • {entry.deliveryType === "pickup" ? "Abholung" : "Lieferung"}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <motion.button
          type="submit"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl bg-gradient-to-r from-amber-700 to-red-700 px-6 py-4 text-base font-bold text-white transition hover:shadow-lg hover:from-amber-800 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
        >
          {loading ? "⏳ Verarbeite Bestellung..." : `✓ Bestellung aufgeben (${checkoutTotal.toFixed(2)} €)`}
        </motion.button>

        {/* Summary at Bottom */}
        <section className="rounded-3xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-red-50 p-5 dark:border-amber-600 dark:from-amber-950/30 dark:to-red-950/20">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">📋 Bestellzusammenfassung</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b border-amber-200 py-2 dark:border-amber-800/50">
              <span className="text-slate-600 dark:text-slate-400">Zwischensumme</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{totals.subtotal.toFixed(2)} €</span>
            </div>
            {formData.deliveryType === "delivery" && (
              <div className="flex justify-between border-b border-amber-200 py-2 dark:border-amber-800/50">
                <span className="text-slate-600 dark:text-slate-400">Liefergebuehr</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">+{checkoutDeliveryFee.toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between py-3 pt-4">
              <span className="text-lg font-bold text-amber-700 dark:text-amber-300">Gesamtbetrag</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-300">{checkoutTotal.toFixed(2)} €</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keine versteckten Gebuehren. Preis inkl. Liefergebuehr.</p>
          </div>
        </section>
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




