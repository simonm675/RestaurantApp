import { useEffect, useState } from "react";
import { DeliveryTypeBadge, StatusBadge, describeOrderProgress } from "../components/OrderBadges";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { orderApi } from "../services/api";

const buildProfileForm = (auth) => ({
  name: auth?.name || "",
  phone: auth?.phone || "",
  password: "",
  addressStreet: auth?.address?.street || "",
  addressHouseNumber: auth?.address?.houseNumber || "",
  addressPostalCode: auth?.address?.postalCode || "",
  addressCity: auth?.address?.city || "",
  deliveryNotes: auth?.deliveryNotes || "",
  preferredDeliveryType: auth?.preferredDeliveryType || "delivery",
  preferredPaymentMethod: auth?.preferredPaymentMethod || "card",
});

const ProfilePage = () => {
  const { auth, updateProfile, loading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(auth));
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  useEffect(() => {
    setProfileForm(buildProfileForm(auth));
  }, [auth]);

  useEffect(() => {
    const loadOrders = async (silent = false) => {
      if (!silent) setOrdersLoading(true);
      try {
        const { data } = await orderApi.getMine();
        setOrders(data);
        setLastUpdatedAt(new Date());
      } finally {
        if (!silent) setOrdersLoading(false);
      }
    };

    loadOrders();

    const interval = setInterval(() => {
      loadOrders(true);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const updateField = (field) => (event) => {
    const { value } = event.target;
    setProfileForm((prev) => ({ ...prev, [field]: value }));
  };

  const fillAddressFromLatestOrder = () => {
    const latestWithAddress = orders.find((order) => order.address);
    if (!latestWithAddress) return;

    const [streetPart, cityPart] = String(latestWithAddress.address).split(",");
    const streetWithNumber = (streetPart || "").trim();
    const cityLine = (cityPart || "").trim();

    const houseMatch = streetWithNumber.match(/^(.*?)(\s+\d+[a-zA-Z]?)$/);
    const street = houseMatch ? houseMatch[1].trim() : streetWithNumber;
    const houseNumber = houseMatch ? houseMatch[2].trim() : "";

    const cityMatch = cityLine.match(/^(\d{4,5})\s+(.+)$/);
    const postalCode = cityMatch ? cityMatch[1].trim() : "";
    const city = cityMatch ? cityMatch[2].trim() : cityLine;

    setProfileForm((prev) => ({
      ...prev,
      addressStreet: street || prev.addressStreet,
      addressHouseNumber: houseNumber || prev.addressHouseNumber,
      addressPostalCode: postalCode || prev.addressPostalCode,
      addressCity: city || prev.addressCity,
    }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    await updateProfile({
      name: profileForm.name,
      phone: profileForm.phone,
      password: profileForm.password || undefined,
      address: {
        street: profileForm.addressStreet,
        houseNumber: profileForm.addressHouseNumber,
        postalCode: profileForm.addressPostalCode,
        city: profileForm.addressCity,
      },
      deliveryNotes: profileForm.deliveryNotes,
      preferredDeliveryType: profileForm.preferredDeliveryType,
      preferredPaymentMethod: profileForm.preferredPaymentMethod,
    });

    setProfileForm((prev) => ({ ...prev, password: "" }));
  };

  const activeOrders = orders.filter((order) => ["pending", "preparing", "ready-for-pickup", "out-for-delivery"].includes(order.status));
  const pastOrders = orders.filter((order) => !activeOrders.some((entry) => entry._id === order._id));

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-6 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-red-950/10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">👤 {auth?.name || "Dein Profil"}</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{auth?.email || "E-Mail nicht verfügbar"}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-1 xl:grid-cols-[300px_1fr]">
        <section className="rounded-2xl border-2 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900 h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">⚙️ Profil bearbeiten</h2>
          <form onSubmit={onSubmit} className="space-y-3">
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Name</span>
              <input
                value={profileForm.name}
                onChange={updateField("name")}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Telefon</span>
              <input
                value={profileForm.phone}
                onChange={updateField("phone")}
                placeholder="+49 ..."
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">E-Mail</span>
              <input
                value={auth?.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-xl border-2 border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400">Kann nicht geändert werden</p>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Neues Passwort (optional)</span>
              <input
                type="password"
                placeholder="••••••••"
                value={profileForm.password}
                onChange={updateField("password")}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
              />
            </label>

            <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-3 dark:border-amber-800/60 dark:bg-amber-950/20">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Lieferadresse</p>
                <button
                  type="button"
                  onClick={fillAddressFromLatestOrder}
                  className="rounded-lg border border-amber-300 px-2.5 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/30"
                >
                  Aus letzter Bestellung
                </button>
              </div>
              <div className="grid gap-2 sm:grid-cols-[1fr_120px]">
                <input
                  value={profileForm.addressStreet}
                  onChange={updateField("addressStreet")}
                  placeholder="Straße"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  value={profileForm.addressHouseNumber}
                  onChange={updateField("addressHouseNumber")}
                  placeholder="Nr."
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[140px_1fr]">
                <input
                  value={profileForm.addressPostalCode}
                  onChange={updateField("addressPostalCode")}
                  placeholder="PLZ"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />
                <input
                  value={profileForm.addressCity}
                  onChange={updateField("addressCity")}
                  placeholder="Stadt"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lieferhinweise (Klingel, Etage, etc.)</span>
              <textarea
                value={profileForm.deliveryNotes}
                onChange={updateField("deliveryNotes")}
                rows={2}
                placeholder="z.B. Bei Schmidt klingeln"
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
              />
            </label>

            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bevorzugte Lieferung</span>
                <select
                  value={profileForm.preferredDeliveryType}
                  onChange={updateField("preferredDeliveryType")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="delivery">Lieferung</option>
                  <option value="pickup">Abholung</option>
                </select>
              </label>
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bevorzugte Zahlung</span>
                <select
                  value={profileForm.preferredPaymentMethod}
                  onChange={updateField("preferredPaymentMethod")}
                  className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="card">Karte</option>
                  <option value="paypal">PayPal</option>
                </select>
              </label>
            </div>

            <button
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-amber-700 to-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:shadow-lg hover:from-amber-800 hover:to-red-800 disabled:opacity-60"
            >
              {loading ? "⏳ Speichern..." : "✓ Speichern"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border-2 border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">📋 Bestellhistorie</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  setOrdersLoading(true);
                  try {
                    const { data } = await orderApi.getMine();
                    setOrders(data);
                    setLastUpdatedAt(new Date());
                  } finally {
                    setOrdersLoading(false);
                  }
                }}
                className="rounded-lg border-2 border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 transition dark:border-amber-600 dark:text-amber-400 dark:hover:bg-amber-950/20"
              >
                🔄 Aktualisieren
              </button>
              {lastUpdatedAt && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live: {lastUpdatedAt.toLocaleTimeString("de-DE")}
                </p>
              )}
            </div>
          </div>

          {ordersLoading ? (
            <div className="mt-4">
              <Spinner label="Bestellungen werden geladen" />
            </div>
          ) : orders.length === 0 ? (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">📭 Noch keine Bestellungen vorhanden.</p>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800/60 dark:bg-amber-950/20">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">⏰ Aktive Bestellungen</h3>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-slate-800 dark:text-amber-200">{activeOrders.length}</span>
                </div>

                {activeOrders.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">✓ Aktuell keine laufende Bestellung.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {activeOrders.map((order) => (
                      <article key={order._id} className="rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800/60 dark:bg-slate-900">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{order.orderNumber || `#${order._id.slice(-6)}`}</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={order.status} />
                            <DeliveryTypeBadge deliveryType={order.deliveryType} />
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">{describeOrderProgress(order)}</p>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(order.createdAt).toLocaleString("de-DE")} • {order.totalPrice.toFixed(2)} €</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">✅ Vergangene Bestellungen</h3>
                {pastOrders.length === 0 ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">Noch keine abgeschlossenen Bestellungen.</p>
                ) : (
                  <div className="max-h-96 space-y-2 overflow-y-auto">
                    {pastOrders.map((order) => (
                      <article key={order._id} className="rounded-lg border-2 border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/50">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{order.orderNumber || `#${order._id.slice(-6)}`}</span>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={order.status} />
                            <DeliveryTypeBadge deliveryType={order.deliveryType} />
                          </div>
                        </div>
                        <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                          {new Date(order.createdAt).toLocaleString("de-DE")} • {order.totalPrice.toFixed(2)} €
                        </p>
                        <ul className="mt-1.5 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          {order.items.map((item, index) => (
                            <li key={`${order._id}-${item.menuItem}-${index}`}>
                              <p>• {item.quantity}x {item.name}</p>
                              {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
                                <p className="pl-3 text-[11px]">{item.selectedOptions.map((option) => `${option.label}: ${option.value}`).join(" | ")}</p>
                              )}
                              {item.specialInstructions && <p className="pl-3 italic text-[11px]">Hinweis: {item.specialInstructions}</p>}
                            </li>
                          ))}
                        </ul>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProfilePage;



