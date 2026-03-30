import { CalendarDays, Clock3, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { reservationApi } from "../services/api";

const STATUS_LABEL = {
  pending: "Ausstehend",
  confirmed: "Bestätigt",
  declined: "Abgelehnt",
  cancelled: "Storniert",
  completed: "Abgeschlossen",
};

const AREA_OPTIONS = [
  { value: "indoor", label: "Innenbereich" },
  { value: "outdoor", label: "Außenbereich" },
  { value: "terrace", label: "Terrasse" },
];

const todayDate = () => new Date().toISOString().split("T")[0];

const ReservationPage = () => {
  const { auth, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [myReservations, setMyReservations] = useState([]);
  const [form, setForm] = useState({
    date: todayDate(),
    time: "18:00",
    partySize: 2,
    area: "indoor",
    durationMinutes: 120,
    specialRequests: "",
    name: auth?.name || "",
    phone: auth?.phone || "",
    email: auth?.email || "",
  });

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: auth?.name || prev.name,
      phone: auth?.phone || prev.phone,
      email: auth?.email || prev.email,
    }));
  }, [auth?.email, auth?.name, auth?.phone]);

  const loadMine = async () => {
    if (!isAuthenticated) return;
    try {
      const { data } = await reservationApi.getMine();
      setMyReservations(data);
    } catch {
      setMyReservations([]);
    }
  };

  useEffect(() => {
    loadMine();
  }, [isAuthenticated]);

  const onChange = (field) => (event) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    try {
      await reservationApi.create({
        date: form.date,
        time: form.time,
        partySize: Number(form.partySize),
        area: form.area,
        durationMinutes: Number(form.durationMinutes),
        specialRequests: form.specialRequests,
        name: form.name,
        phone: form.phone,
        email: form.email,
      });
      toast.success("Reservierung gesendet");
      setForm((prev) => ({ ...prev, specialRequests: "" }));
      await loadMine();
    } catch (error) {
      toast.error(error.response?.data?.message || "Reservierung fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const cancelReservation = async (id) => {
    try {
      await reservationApi.cancelMine(id);
      toast.success("Reservierung storniert");
      await loadMine();
    } catch (error) {
      toast.error(error.response?.data?.message || "Stornierung fehlgeschlagen");
    }
  };

  const upcomingReservations = useMemo(
    () => myReservations.filter((entry) => ["pending", "confirmed"].includes(entry.status)),
    [myReservations]
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-700 to-red-700 p-6 text-white shadow-xl dark:border-amber-800/40">
        <h1 className="text-3xl font-black">Tischreservierung</h1>
        <p className="mt-2 text-sm text-white/90">
          Reserviere deinen Tisch online. Für Gruppen ab 10 Personen empfehlen wir eine Reservierung mindestens 24 Stunden vorher.
        </p>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_1fr]">
        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-slate-100">Reservierung anfragen</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Name</span>
              <input value={form.name} onChange={onChange("name")} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Telefon</span>
              <input value={form.phone} onChange={onChange("phone")} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">E-Mail</span>
              <input type="email" value={form.email} onChange={onChange("email")} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </label>
            <label className="space-y-1.5">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200"><CalendarDays size={14} /> Datum</span>
              <input type="date" value={form.date} min={todayDate()} onChange={onChange("date")} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </label>
            <label className="space-y-1.5">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200"><Clock3 size={14} /> Uhrzeit</span>
              <input type="time" value={form.time} onChange={onChange("time")} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </label>
            <label className="space-y-1.5">
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200"><Users size={14} /> Personen</span>
              <input type="number" min={1} max={20} value={form.partySize} onChange={onChange("partySize")} required className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </label>
            <label className="space-y-1.5">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Bereich</span>
              <select value={form.area} onChange={onChange("area")} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                {AREA_OPTIONS.map((entry) => <option key={entry.value} value={entry.value}>{entry.label}</option>)}
              </select>
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Besondere Wünsche</span>
              <textarea value={form.specialRequests} onChange={onChange("specialRequests")} rows={3} placeholder="z. B. Kinderstuhl, Geburtstag, ruhiger Tisch" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
            </label>
          </div>
          <button disabled={loading} className="mt-4 rounded-xl bg-gradient-to-r from-amber-700 to-red-700 px-5 py-2.5 text-sm font-bold text-white hover:from-amber-800 hover:to-red-800 disabled:opacity-60">
            {loading ? "Wird gesendet..." : "Reservierung senden"}
          </button>
        </form>

        <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Deine Reservierungen</h2>
          {!isAuthenticated && <p className="text-sm text-slate-600 dark:text-slate-300">Melde dich an, um deine Reservierungen hier zu sehen und zu stornieren.</p>}
          {isAuthenticated && upcomingReservations.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-300">Noch keine aktiven Reservierungen.</p>
          )}
          {isAuthenticated && upcomingReservations.map((entry) => (
            <article key={entry._id} className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {new Date(entry.reservationAt).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                </p>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {STATUS_LABEL[entry.status] || entry.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{entry.partySize} Personen • {AREA_OPTIONS.find((a) => a.value === entry.area)?.label || entry.area}</p>
              {entry.specialRequests && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Hinweis: {entry.specialRequests}</p>}
              {entry.status !== "cancelled" && entry.status !== "completed" && entry.status !== "declined" && (
                <button
                  type="button"
                  onClick={() => cancelReservation(entry._id)}
                  className="mt-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 dark:border-red-700 dark:text-red-300"
                >
                  Stornieren
                </button>
              )}
            </article>
          ))}
        </section>
      </section>
    </div>
  );
};

export default ReservationPage;
