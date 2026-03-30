import {
  CreditCard,
  Gift,
  Headset,
  Heart,
  History,
  MapPin,
  Moon,
  Sun,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { DeliveryTypeBadge, StatusBadge, describeOrderProgress } from "../components/OrderBadges";
import Spinner from "../components/Spinner";
import { useAuth } from "../context/AuthContext";
import { useFavorites } from "../context/FavoritesContext";
import { useUI } from "../context/UIContext";
import useOrderTimer from "../hooks/useOrderTimer";
import { orderApi } from "../services/api";

const buildProfileForm = (auth) => ({
  name: auth?.name || "",
  phone: auth?.phone || "",
  password: "",
  confirmPassword: "",
  addressStreet: auth?.address?.street || "",
  addressHouseNumber: auth?.address?.houseNumber || "",
  addressPostalCode: auth?.address?.postalCode || "",
  addressCity: auth?.address?.city || "",
  deliveryNotes: auth?.deliveryNotes || "",
  preferredDeliveryType: auth?.preferredDeliveryType || "delivery",
  preferredPaymentMethod: auth?.preferredPaymentMethod || "card",
});

const ActiveOrderLiveTimer = ({ order }) => {
  const timer = useOrderTimer({
    createdAt: order.createdAt,
    estimatedReadyAt: order.estimatedReadyAt,
  });

  return (
    <div className="w-full space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${timer.badgeClass}`}>
          Live {timer.label}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${timer.customerBadgeClass}`}>
          {timer.etaLabel}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className={`h-full transition-all ${
            timer.isOverdue
              ? "bg-red-500"
              : timer.customerTone === "soon"
                ? "bg-amber-500"
                : "bg-emerald-500"
          }`}
          style={{ width: `${timer.progressPercent}%` }}
        />
      </div>
    </div>
  );
};

const TAB_ITEMS = [
  { id: "personal", label: "Persoenliche Angaben", icon: UserRound },
  { id: "payment", label: "Zahlungsmethoden", icon: CreditCard },
  { id: "addresses", label: "Adressen", icon: MapPin },
  { id: "history", label: "Bestellhistorie", icon: History },
];

const getInitials = (name) => {
  const safe = String(name || "").trim();
  if (!safe) return "U";
  const parts = safe.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() || "").join("");
};

const OrdersPanel = ({
  orders,
  ordersLoading,
  activeOrders,
  pastOrders,
  lastUpdatedAt,
  onRefresh,
}) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Bestellhistorie</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20"
          >
            Aktualisieren
          </button>
          {lastUpdatedAt && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live: {lastUpdatedAt.toLocaleTimeString("de-DE")}
            </p>
          )}
        </div>
      </div>

      {ordersLoading ? (
        <Spinner label="Bestellungen werden geladen" />
      ) : orders.length === 0 ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">Noch keine Bestellungen vorhanden.</p>
      ) : (
        <div className="space-y-5">
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 dark:border-amber-800/60 dark:bg-amber-950/20">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                Aktive Bestellungen
              </h3>
              <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-slate-800 dark:text-amber-300">
                {activeOrders.length}
              </span>
            </div>

            {activeOrders.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">Aktuell keine laufende Bestellung.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {activeOrders.map((order) => (
                  <article
                    key={order._id}
                    className="rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-800/60 dark:bg-slate-900"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {order.orderNumber || `#${order._id.slice(-6)}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <StatusBadge status={order.status} />
                        <DeliveryTypeBadge deliveryType={order.deliveryType} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <ActiveOrderLiveTimer order={order} />
                    </div>
                    <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-300">{describeOrderProgress(order)}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(order.createdAt).toLocaleString("de-DE")} • {order.totalPrice.toFixed(2)} €
                    </p>
                  </article>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Vergangene Bestellungen
            </h3>
            {pastOrders.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">Noch keine abgeschlossenen Bestellungen.</p>
            ) : (
              <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                {pastOrders.map((order) => (
                  <article
                    key={order._id}
                    className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {order.orderNumber || `#${order._id.slice(-6)}`}
                      </span>
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
                            <p className="pl-3 text-[11px]">
                              {item.selectedOptions
                                .map((option) => `${option.label}: ${option.value}`)
                                .join(" | ")}
                            </p>
                          )}
                          {item.specialInstructions && (
                            <p className="pl-3 italic text-[11px]">Hinweis: {item.specialInstructions}</p>
                          )}
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
  );
};

const ProfilePage = () => {
  const { auth, updateProfile, loading, logout } = useAuth();
  const { favorites } = useFavorites();
  const { theme, toggleTheme } = useUI();
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [profileForm, setProfileForm] = useState(() => buildProfileForm(auth));
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

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

    if (profileForm.password) {
      if (profileForm.password.length < 6) {
        toast.error("Neues Passwort muss mindestens 6 Zeichen haben");
        return;
      }

      if (profileForm.password !== profileForm.confirmPassword) {
        toast.error("Passwort-Bestaetigung stimmt nicht ueberein");
        return;
      }
    }

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

    setProfileForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
  };

  const activeOrders = orders.filter((order) => ["pending", "preparing", "ready-for-pickup", "out-for-delivery"].includes(order.status));
  const pastOrders = orders.filter((order) => !activeOrders.some((entry) => entry._id === order._id));
  const initials = useMemo(() => getInitials(auth?.name), [auth?.name]);

  const refreshOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await orderApi.getMine();
      setOrders(data);
      setLastUpdatedAt(new Date());
    } finally {
      setOrdersLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 px-6 py-7 text-slate-900 shadow-xl dark:border-amber-900/30 dark:from-amber-950/20 dark:to-red-950/10 dark:text-slate-100">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Profil</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Kontoverwaltung und Einstellungen</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Headset size={16} /> Kundensupport kontaktieren
            </button>
            <button
              onClick={toggleTheme}
              className="rounded-lg border border-amber-300 p-2.5 text-slate-700 transition hover:bg-amber-50 dark:border-amber-700 dark:text-slate-100 dark:hover:bg-amber-900/20"
              aria-label="Theme wechseln"
              title={theme === "dark" ? "Zu Hell-Modus" : "Zu Dunkel-Modus"}
            >
              {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button
              onClick={logout}
              className="rounded-lg bg-gradient-to-r from-amber-700 to-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:from-amber-800 hover:to-red-800"
            >
              Abmelden
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex gap-2 overflow-x-auto">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                  active
                    ? "bg-gradient-to-r from-amber-700 to-red-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-amber-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-amber-900/20"
                }`}
              >
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      </section>

      {activeTab === "history" ? (
        <OrdersPanel
          orders={orders}
          ordersLoading={ordersLoading}
          activeOrders={activeOrders}
          pastOrders={pastOrders}
          lastUpdatedAt={lastUpdatedAt}
          onRefresh={refreshOrders}
        />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
          <section className="space-y-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-lime-100 text-3xl font-medium text-slate-600 dark:bg-lime-900/20 dark:text-lime-100">
                  {initials}
                </div>
                <div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{auth?.name || "Dein Profil"}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{auth?.email || "E-Mail nicht verfügbar"}</p>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{profileForm.phone || "Telefonnummer fehlt"}</p>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-700 to-red-700 p-5 text-white dark:border-amber-800/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">Treuekarten</p>
                  <p className="mt-1 text-sm text-white/90">Nutze Treuekarten und Vorteile fuer wiederkehrende Bestellungen.</p>
                </div>
                <Gift size={20} className="text-white/90" />
              </div>
            </article>

            <article className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-700 to-red-700 p-5 text-white dark:border-amber-800/60">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-bold">Kunden-Guthaben</p>
                  <p className="mt-1 text-sm text-white/90">Aktueller Kontostand fuer kommende Bestellungen.</p>
                </div>
                <CreditCard size={20} className="text-white/90" />
              </div>
              <p className="mt-4 text-right text-2xl font-black">0,00 €</p>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100">Deine Favoriten</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    Markiere Gerichte als Favorit und finde sie schneller wieder.
                  </p>
                </div>
                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 dark:border-slate-600 dark:text-slate-200">
                  <Heart size={16} className="text-red-500" /> {favorites.length} Favoriten
                </div>
              </div>
              <div className="mt-3 max-h-36 space-y-1 overflow-y-auto pr-1 text-sm text-slate-600 dark:text-slate-300">
                {favorites.length === 0 ? (
                  <p>Noch keine Favoriten gespeichert.</p>
                ) : (
                  favorites.map((item) => (
                    <p key={item._id} className="truncate">• {item.name}</p>
                  ))
                )}
              </div>
            </article>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="mb-4 text-lg font-black text-slate-900 dark:text-slate-100">
              {activeTab === "addresses" ? "Adressen" : activeTab === "payment" ? "Zahlungsmethoden" : "Persoenliche Angaben"}
            </h2>

            <form onSubmit={onSubmit} className="space-y-3">
              {(activeTab === "personal" || activeTab === "payment") && (
                <>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Name</span>
                    <input
                      value={profileForm.name}
                      onChange={updateField("name")}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Telefonnummer</span>
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
                  <label className="block space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Neues Passwort bestaetigen</span>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={profileForm.confirmPassword}
                      onChange={updateField("confirmPassword")}
                      className="w-full rounded-xl border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                </>
              )}

              {(activeTab === "personal" || activeTab === "addresses") && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 dark:border-amber-800/60 dark:bg-amber-950/20">
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
                  <label className="mt-2 block space-y-1.5">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Lieferhinweise</span>
                    <textarea
                      value={profileForm.deliveryNotes}
                      onChange={updateField("deliveryNotes")}
                      rows={2}
                      placeholder="z.B. Bei Schmidt klingeln"
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
                    />
                  </label>
                </div>
              )}

              {(activeTab === "personal" || activeTab === "payment") && (
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
              )}

              <button
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-amber-700 to-red-700 px-4 py-2.5 text-sm font-bold text-white transition hover:from-amber-800 hover:to-red-800 disabled:opacity-60"
              >
                {loading ? "Speichern..." : "Aenderungen speichern"}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;




