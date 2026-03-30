import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import fallbackImage from "../assets/hero.png";
import DishCard from "../components/DishCard";
import { DeliveryTypeBadge, PriorityBadge, StatusBadge, describeOrderProgress } from "../components/OrderBadges";
import Spinner from "../components/Spinner";
import KitchenPage from "./KitchenPage";
import { menuApi, orderApi, reservationApi, userApi } from "../services/api";

const initialForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  image: "",
  featured: false,
};

const STATUS_OPTIONS = [
  ["pending", "pending"],
  ["preparing", "preparing"],
  ["ready-for-pickup", "ready-for-pickup"],
  ["out-for-delivery", "out-for-delivery"],
  ["completed", "completed"],
  ["cancelled", "cancelled"],
];

const PRIORITY_OPTIONS = [
  ["low", "low"],
  ["normal", "normal"],
  ["high", "high"],
  ["urgent", "urgent"],
];

const ACTIVE_ORDER_STATUSES = ["pending", "preparing", "ready-for-pickup", "out-for-delivery"];
const NEW_ORDER_WINDOW_MS = 3 * 60 * 1000;

const isLateOrder = (order) => {
  if (!order?.estimatedReadyAt) return false;
  return ACTIVE_ORDER_STATUSES.includes(order.status) && new Date(order.estimatedReadyAt).getTime() < Date.now();
};

const isNewOrder = (order) => {
  if (!order?.createdAt) return false;
  return Date.now() - new Date(order.createdAt).getTime() <= NEW_ORDER_WINDOW_MS;
};

const shouldHighlightNewOrder = (order) => isNewOrder(order) && order?.status === "pending";

const getNextStatus = (order) => {
  if (order.status === "pending") return "preparing";
  if (order.status === "preparing") return order.deliveryType === "pickup" ? "ready-for-pickup" : "out-for-delivery";
  if (order.status === "ready-for-pickup") return "completed";
  if (order.status === "out-for-delivery") return "completed";
  return null;
};

const getNextStepLabel = (order) => {
  const nextStatus = getNextStatus(order);
  if (!nextStatus) return "";

  if (nextStatus === "preparing") return "Nächster Schritt: In Zubereitung";
  if (nextStatus === "ready-for-pickup") return "Nächster Schritt: Bereit zur Abholung";
  if (nextStatus === "out-for-delivery") return "Nächster Schritt: In Lieferung";
  if (nextStatus === "completed") return "Nächster Schritt: Abschließen";

  return `Nächster Schritt: ${nextStatus}`;
};

const priorityWeight = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState("orders");
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState({
    totalOrders: 0,
    statuses: {
      pending: 0,
      preparing: 0,
      readyForPickup: 0,
      outForDelivery: 0,
      completed: 0,
      cancelled: 0,
    },
    lateOrders: 0,
    deliveryCount: 0,
    pickupCount: 0,
    revenueToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [searchInput, setSearchInput] = useState("");
  const [orderFilters, setOrderFilters] = useState({
    status: "all",
    deliveryType: "all",
    priority: "all",
    lateOnly: false,
    search: "",
  });
  const [courierDrafts, setCourierDrafts] = useState({});
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const loadAdminData = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const params = {
        ...(orderFilters.status !== "all" ? { status: orderFilters.status } : {}),
        ...(orderFilters.deliveryType !== "all" ? { deliveryType: orderFilters.deliveryType } : {}),
        ...(orderFilters.priority !== "all" ? { priority: orderFilters.priority } : {}),
        ...(orderFilters.lateOnly ? { lateOnly: true } : {}),
        ...(orderFilters.search ? { search: orderFilters.search } : {}),
      };

      if (activeTab === "delivery") {
        params.deliveryType = "delivery";
      }

      if (activeTab === "pickup") {
        params.deliveryType = "pickup";
      }

      const [menuRes, ordersRes, reservationsRes, usersRes, summaryRes] = await Promise.all([
        menuApi.getAll(),
        orderApi.getAll(params),
        reservationApi.getAll({ status: "all" }),
        userApi.getAll(),
        orderApi.getSummary(),
      ]);
      setMenuItems(menuRes.data);
      setOrders(ordersRes.data);
      setReservations(Array.isArray(reservationsRes.data) ? reservationsRes.data : []);
      setUsers(usersRes.data);
      setSummary(summaryRes.data);
      setLastUpdatedAt(new Date());
    } catch (error) {
      if (!silent) {
        toast.error(error.response?.data?.message || "Restaurant-Bereich konnte nicht geladen werden");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [
    activeTab,
    orderFilters.status,
    orderFilters.deliveryType,
    orderFilters.priority,
    orderFilters.lateOnly,
    orderFilters.search,
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      loadAdminData({ silent: true });
    }, 15000);

    return () => clearInterval(interval);
  }, [
    activeTab,
    orderFilters.status,
    orderFilters.deliveryType,
    orderFilters.priority,
    orderFilters.lateOnly,
    orderFilters.search,
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOrderFilters((prev) => ({ ...prev, search: searchInput.trim() }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const onFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onSaveMenuItem = async (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      image: form.image.trim(),
      price: Number(form.price),
    };

    try {
      if (editingId) {
        await menuApi.update(editingId, payload);
        toast.success("Gericht aktualisiert");
      } else {
        await menuApi.create(payload);
        toast.success("Gericht erstellt");
      }

      setForm(initialForm);
      setEditingId(null);
      loadAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Speichern fehlgeschlagen");
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      image: item.image,
      featured: item.featured,
    });
  };

  const deleteItem = async (id) => {
    try {
      await menuApi.remove(id);
      toast.success("Gericht geloescht");
      loadAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Loeschen fehlgeschlagen");
    }
  };

  const patchOrder = async (id, payload, successMessage) => {
    try {
      await orderApi.updateStatus(id, payload);
      toast.success(successMessage || "Bestellung aktualisiert");
      loadAdminData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Bestellung konnte nicht aktualisiert werden");
    }
  };

  const setOrderStatus = async (id, status) => {
    await patchOrder(id, { status }, "Status aktualisiert");
  };

  const setOrderPriority = async (id, priority) => {
    await patchOrder(id, { priority }, "Prioritaet aktualisiert");
  };

  const saveCourier = async (order) => {
    const assignedCourier = (courierDrafts[order._id] ?? order.assignedCourier ?? "").trim();
    await patchOrder(order._id, { assignedCourier }, "Kurier aktualisiert");
  };

  const bumpEta = async (order, deltaMinutes) => {
    const current = Number(order.estimatedPrepMinutes || 25);
    const estimatedPrepMinutes = Math.max(5, Math.min(180, current + deltaMinutes));
    await patchOrder(order._id, { estimatedPrepMinutes }, "ETA aktualisiert");
  };

  const sortedOrders = [...orders].sort((a, b) => {
    // Neue Bestellungen immer zuerst anzeigen.
    const createdAtDiff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (createdAtDiff !== 0) return createdAtDiff;

    const priorityRank = (priorityWeight[a.priority] ?? 9) - (priorityWeight[b.priority] ?? 9);
    if (priorityRank !== 0) return priorityRank;

    const etaA = a.estimatedReadyAt ? new Date(a.estimatedReadyAt).getTime() : Number.MAX_SAFE_INTEGER;
    const etaB = b.estimatedReadyAt ? new Date(b.estimatedReadyAt).getTime() : Number.MAX_SAFE_INTEGER;
    return etaA - etaB;
  });

  const deliveryBoardOrders = sortedOrders.filter(
    (order) => order.deliveryType === "delivery" && ["preparing", "out-for-delivery"].includes(order.status)
  );

  const pickupBoardOrders = sortedOrders.filter(
    (order) => order.deliveryType === "pickup" && ["pending", "preparing", "ready-for-pickup"].includes(order.status)
  );

  const visibleOrders =
    activeTab === "delivery"
      ? deliveryBoardOrders
      : activeTab === "pickup"
        ? pickupBoardOrders
        : sortedOrders;
  const isDeliveryTab = activeTab === "delivery";
  const isPickupTab = activeTab === "pickup";
  const isOperationalTab = isDeliveryTab || isPickupTab;

  const newVisibleOrdersCount = visibleOrders.filter((order) => shouldHighlightNewOrder(order)).length;

  const tabCounts = {
    orders: sortedOrders.length,
    kitchen: sortedOrders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)).length,
    delivery: deliveryBoardOrders.length,
    pickup: pickupBoardOrders.length,
    menu: menuItems.length,
    reservations: reservations.length,
    users: users.length,
  };

  const setReservationStatus = async (id, status) => {
    try {
      await reservationApi.updateStatus(id, { status });
      toast.success("Reservierung aktualisiert");
      loadAdminData({ silent: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Reservierung konnte nicht aktualisiert werden");
    }
  };

  if (loading) return <Spinner label="Restaurant-Bereich wird geladen" />;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-6 dark:border-amber-900/30 dark:from-amber-950/20 dark:to-red-950/10">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">🎯 Restaurant-Bereich</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Zentraler Überblick für Küche, Abholung und Lieferung mit Live-Daten</p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <article className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-50/50 p-4 dark:border-amber-800/40 dark:from-amber-950/30 dark:to-amber-950/10">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-400">💰 Heute Umsatz</p>
          <p className="mt-1.5 text-2xl font-black text-amber-700 dark:text-amber-300">{summary.revenueToday.toFixed(2)} €</p>
        </article>
        <article className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-red-50/50 p-4 dark:border-amber-800/40 dark:from-amber-950/30 dark:to-red-950/10">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-400">📋 Offen</p>
          <p className="mt-1.5 text-2xl font-black text-amber-700 dark:text-amber-300">{summary.statuses.pending + summary.statuses.preparing + (summary.statuses.readyForPickup || 0)}</p>
        </article>
        <article className="rounded-xl border-2 border-sky-200 bg-gradient-to-br from-sky-50 to-sky-50/50 p-4 dark:border-sky-800/40 dark:from-sky-950/30 dark:to-sky-950/10">
          <p className="text-xs font-bold uppercase tracking-wide text-sky-800 dark:text-sky-400">🚗 In Lieferung</p>
          <p className="mt-1.5 text-2xl font-black text-sky-700 dark:text-sky-300">{summary.statuses.outForDelivery}</p>
        </article>
        <article className="rounded-xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-red-50/50 p-4 dark:border-red-800/40 dark:from-red-950/30 dark:to-red-950/10">
          <p className="text-xs font-bold uppercase tracking-wide text-red-800 dark:text-red-400">⏰ Verspätet</p>
          <p className="mt-1.5 text-2xl font-black text-red-700 dark:text-red-300">{summary.lateOrders}</p>
        </article>
        <article className="rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-50/50 p-4 dark:border-emerald-800/40 dark:from-emerald-950/30 dark:to-emerald-950/10">
          <p className="text-xs font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">📦 Lieferung</p>
          <p className="mt-1.5 text-2xl font-black text-emerald-700 dark:text-emerald-300">{summary.deliveryCount}</p>
        </article>
        <article className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-50/50 p-4 dark:border-indigo-800/40 dark:from-indigo-950/30 dark:to-indigo-950/10">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-800 dark:text-indigo-400">🏪 Abholung</p>
          <p className="mt-1.5 text-2xl font-black text-indigo-700 dark:text-indigo-300">{summary.pickupCount}</p>
        </article>
      </section>

      <div className="flex flex-wrap gap-2 items-center">
        {[
          ["orders", "📋 Bestellungen"],
          ["kitchen", "👨‍🍳 Küche"],
          ["delivery", "🚗 Delivery Board"],
          ["pickup", "🏪 Abholung"],
          ["menu", "🍕 Gerichte"],
          ["reservations", "🪑 Reservierungen"],
          ["users", "👥 Benutzer"],
        ].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition ${
              activeTab === key
                ? "bg-gradient-to-r from-amber-700 to-red-700 text-white shadow-lg"
                : "border-2 border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50 dark:border-slate-700 dark:text-slate-200 dark:hover:border-amber-600 dark:hover:bg-amber-950/20"
            }`}
          >
            <span>{label}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${activeTab === key ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>
              {tabCounts[key] ?? 0}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => loadAdminData({ silent: true })}
          className="rounded-lg border-2 border-slate-300 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 transition"
        >
          🔄 Aktualisieren
        </button>
        {lastUpdatedAt && (
          <p className="self-center text-xs text-slate-500 dark:text-slate-400">
            ⏱️ Zuletzt: {lastUpdatedAt.toLocaleTimeString("de-DE")}
          </p>
        )}
      </div>

      {(activeTab === "orders" || activeTab === "delivery" || activeTab === "pickup") && (
        <section className="rounded-2xl border-2 border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900 lg:grid lg:grid-cols-5 lg:gap-3">
          <label className="relative block lg:col-span-2">
            <span className="absolute left-3 top-3 text-lg">🔍</span>
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Suche Order-ID, Adresse..."
              className="w-full rounded-lg border-2 border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
            />
          </label>
          <select
            value={orderFilters.status}
            onChange={(event) => setOrderFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">📌 Alle Status</option>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            value={orderFilters.deliveryType}
            onChange={(event) => setOrderFilters((prev) => ({ ...prev, deliveryType: event.target.value }))}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
            disabled={activeTab === "delivery" || activeTab === "pickup"}
          >
            <option value="all">🚚 Alle Lieferarten</option>
            <option value="delivery">🚗 Lieferung</option>
            <option value="pickup">🏪 Abholung</option>
          </select>
          <select
            value={orderFilters.priority}
            onChange={(event) => setOrderFilters((prev) => ({ ...prev, priority: event.target.value }))}
            className="rounded-lg border-2 border-slate-200 bg-white px-3 py-2.5 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="all">⭐ Alle Prioritäten</option>
            {PRIORITY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200 lg:col-span-5 pt-2">
            <input
              type="checkbox"
              checked={orderFilters.lateOnly}
              onChange={(event) => setOrderFilters((prev) => ({ ...prev, lateOnly: event.target.checked }))}
              className="w-4 h-4 rounded-md cursor-pointer accent-amber-600"
            />
            <span>Nur verspätete Bestellungen anzeigen</span>
          </label>
        </section>
      )}

      {activeTab === "menu" && (
        <div className="space-y-6">
          <form onSubmit={onSaveMenuItem} className="grid gap-3 rounded-3xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900 md:grid-cols-2">
            <input name="name" value={form.name} onChange={onFormChange} required placeholder="Name" className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
            <input name="category" value={form.category} onChange={onFormChange} required placeholder="Kategorie" className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
            <input name="price" value={form.price} onChange={onFormChange} required type="number" step="0.01" placeholder="Preis" className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
            <input name="image" value={form.image} onChange={onFormChange} placeholder="Bild-URL (optional)" className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800" />
            <textarea name="description" value={form.description} onChange={onFormChange} required placeholder="Beschreibung" rows={3} className="rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800 md:col-span-2" />
            <div className="md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 dark:border-slate-600 dark:bg-slate-800/40">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">Bildvorschau</p>
              <img
                src={form.image.trim() || fallbackImage}
                alt="Vorschau"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackImage;
                }}
                className="h-36 w-full rounded-lg object-cover"
              />
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              <input type="checkbox" name="featured" checked={form.featured} onChange={onFormChange} />
              Featured
            </label>
            <div className="md:col-span-2 flex gap-3">
              <button className="rounded-full bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-amber-600">
                {editingId ? "Aktualisieren" : "Hinzufuegen"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(initialForm);
                  }}
                  className="rounded-full border border-slate-300 px-5 py-2 text-sm font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                >
                  Abbrechen
                </button>
              )}
            </div>
          </form>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {menuItems.map((item) => (
              <DishCard
                key={item._id}
                item={item}
                adminActions={
                  <>
                    <button onClick={() => startEdit(item)} className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700">
                      Bearbeiten
                    </button>
                    <button onClick={() => deleteItem(item._id)} className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500">
                      Loeschen
                    </button>
                  </>
                }
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "kitchen" && <KitchenPage />}

      {(activeTab === "orders" || activeTab === "delivery" || activeTab === "pickup") && (
        <div className="space-y-3">
          {newVisibleOrdersCount > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
              🔔 {newVisibleOrdersCount} neue Bestellung{newVisibleOrdersCount > 1 ? "en" : ""} in den letzten 3 Minuten
            </div>
          )}
          {visibleOrders.map((order) => (
            <article
              key={order._id}
              className={`rounded-2xl border bg-white p-4 dark:bg-slate-900 ${
                shouldHighlightNewOrder(order)
                  ? "border-amber-400 shadow-lg ring-2 ring-amber-300/70 dark:border-amber-500 dark:ring-amber-700/60"
                  : isLateOrder(order)
                    ? "border-red-300 dark:border-red-700"
                    : "border-slate-200 dark:border-slate-700"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {order.orderNumber || `Bestellung #${order._id.slice(-6)}`} - {order.guestName || order.userId?.name || "Gast"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(order.createdAt).toLocaleString("de-DE")}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {shouldHighlightNewOrder(order) && (
                    <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-bold text-white">NEU</span>
                  )}
                  <StatusBadge status={order.status} />
                  <PriorityBadge priority={order.priority || "normal"} />
                  <DeliveryTypeBadge deliveryType={order.deliveryType} />
                  {isLateOrder(order) && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">SPAET</span>}
                </div>
              </div>

              {isOperationalTab ? (
                <div className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-3">
                  <p>
                    <span className="font-semibold">Telefon:</span> {order.customerPhone || "-"}
                  </p>
                  {isDeliveryTab && (
                    <p>
                      <span className="font-semibold">ETA:</span>{" "}
                      {order.estimatedReadyAt
                        ? new Date(order.estimatedReadyAt).toLocaleTimeString("de-DE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-"}
                    </p>
                  )}
                  {isDeliveryTab && (
                    <p>
                      <span className="font-semibold">Kurier:</span> {order.assignedCourier || "-"}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-3 grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-4">
                  <p>
                    <span className="font-semibold">Lieferart:</span> {order.deliveryType}
                  </p>
                  <p>
                    <span className="font-semibold">Zahlung:</span> {order.paymentMethod}
                  </p>
                  <p>
                    <span className="font-semibold">Telefon:</span> {order.customerPhone || "-"}
                  </p>
                  <p>
                    <span className="font-semibold">ETA:</span>{" "}
                    {order.estimatedReadyAt
                      ? new Date(order.estimatedReadyAt).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "-"}
                  </p>
                </div>
              )}

              {(isDeliveryTab || !isOperationalTab) && (
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Adresse:</span> {order.address}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{describeOrderProgress(order)}</p>
              {!!order.deliveryNotes && (
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Hinweis:</span> {order.deliveryNotes}
                </p>
              )}
              {!isOperationalTab && (
                <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {order.subtotal?.toFixed(2)} EUR + {order.deliveryFee?.toFixed(2)} EUR = {order.totalPrice.toFixed(2)} EUR
                </p>
              )}

              <ul className="mt-3 space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                {order.items.map((item, index) => (
                  <li key={`${order._id}-${item.menuItem}-${index}`}>
                    <p>• {item.quantity}x {item.name}</p>
                    {Array.isArray(item.selectedOptions) && item.selectedOptions.length > 0 && (
                      <p className="pl-3 text-xs text-slate-500 dark:text-slate-400">
                        {item.selectedOptions.map((option) => `${option.label}: ${option.value}`).join(" | ")}
                      </p>
                    )}
                    {item.specialInstructions && <p className="pl-3 text-xs italic text-slate-500 dark:text-slate-400">Hinweis: {item.specialInstructions}</p>}
                  </li>
                ))}
              </ul>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {!isOperationalTab && (
                  <>
                    <select
                      value={order.status}
                      onChange={(event) => setOrderStatus(order._id, event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase dark:border-slate-700 dark:bg-slate-800"
                    >
                      {STATUS_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={order.priority || "normal"}
                      onChange={(event) => setOrderPriority(order._id, event.target.value)}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase dark:border-slate-700 dark:bg-slate-800"
                    >
                      {PRIORITY_OPTIONS.map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </>
                )}

                {isDeliveryTab && (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={courierDrafts[order._id] ?? order.assignedCourier ?? ""}
                        onChange={(event) =>
                          setCourierDrafts((prev) => ({
                            ...prev,
                            [order._id]: event.target.value,
                          }))
                        }
                        placeholder="Kurier"
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => saveCourier(order)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      >
                        Set
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => bumpEta(order, 10)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      >
                        ETA +10
                      </button>
                      <button
                        type="button"
                        onClick={() => bumpEta(order, -10)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-600 dark:text-slate-200"
                      >
                        ETA -10
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {getNextStatus(order) && (
                  <button
                    type="button"
                    onClick={() => setOrderStatus(order._id, getNextStatus(order))}
                    className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-amber-600"
                  >
                    {getNextStepLabel(order)}
                  </button>
                )}
                {order.deliveryType === "pickup" && order.status === "preparing" && (
                  <button
                    type="button"
                    onClick={() => setOrderStatus(order._id, "ready-for-pickup")}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    Bereit zur Abholung
                  </button>
                )}
                {order.deliveryType === "pickup" && order.status === "ready-for-pickup" && (
                  <button
                    type="button"
                    onClick={() => setOrderStatus(order._id, "completed")}
                    className="rounded-full bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-500"
                  >
                    Abgeholt
                  </button>
                )}
                {ACTIVE_ORDER_STATUSES.includes(order.status) && (
                  <button
                    type="button"
                    onClick={() => setOrderStatus(order._id, "cancelled")}
                    className="rounded-full border border-red-300 px-4 py-2 text-xs font-bold text-red-700 dark:border-red-700 dark:text-red-300"
                  >
                    Stornieren
                  </button>
                )}
              </div>
            </article>
          ))}
          {visibleOrders.length === 0 && (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              Keine passenden Bestellungen gefunden.
            </p>
          )}
        </div>
      )}

      {activeTab === "users" && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">E-Mail</th>
                <th className="px-4 py-3">Rolle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "reservations" && (
        <div className="space-y-3">
          {reservations.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-600 dark:border-slate-700 dark:text-slate-300">
              Keine Reservierungen vorhanden.
            </p>
          ) : (
            reservations.map((entry) => (
              <article key={entry._id} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {entry.name} • {entry.partySize} Personen
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {new Date(entry.reservationAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {entry.phone || "-"} • {entry.email || "-"}
                    </p>
                  </div>
                  <select
                    value={entry.status}
                    onChange={(event) => setReservationStatus(entry._id, event.target.value)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold uppercase dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="pending">pending</option>
                    <option value="confirmed">confirmed</option>
                    <option value="declined">declined</option>
                    <option value="cancelled">cancelled</option>
                    <option value="completed">completed</option>
                  </select>
                </div>
                {entry.specialRequests && (
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Hinweis: {entry.specialRequests}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;






