import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DishCard from "../components/DishCard";
import { SkeletonMenuGrid } from "../components/SkeletonLoaders";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { menuApi } from "../services/api";

const deliveryAreas = [
  "Lemfoerde",
  "Stemshorn",
  "Dielingen",
  "Huede",
  "Brockum",
  "Quernheim",
  "Marl",
  "Hagewede",
];

const menuHighlights = [
  "Panini Hackfleisch-Zwiebeln-Kaese (91)",
  "Mozzarella Caprese (36)",
  "Aperol Spritz",
  "Bruschetta (41)",
  "Pizzabrot Tomate-Mozzarella-Basilikum-Olivenoel (98)",
  "Panini Schinken-Kaese (74)",
  "Fassbrause",
  "Pizza Italia (23)",
];

const HomePage = () => {
  const { addToCart, totals } = useCart();
  const { t } = useLanguage();
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const { data } = await menuApi.getAll({ featured: true });
        setFeatured(data);
      } finally {
        setLoading(false);
      }
    };

    loadFeatured();
  }, []);

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-700 via-red-600 to-amber-800 p-8 shadow-2xl sm:p-16">
        <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute right-4 top-4 hidden overflow-hidden rounded-2xl border border-white/40 bg-black/20 shadow-2xl ring-1 ring-amber-800/30 md:block">
          <img
            src="https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=900&q=80"
            alt="Ofenfrische Spezialitaeten"
            className="h-40 w-56 object-cover"
          />
        </div>
        <div className="relative z-10 max-w-2xl space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/85">🍕 Authentic Italian Pizzeria</p>
            <h1 className="mt-2 text-5xl font-black leading-tight text-white md:text-6xl">
              {t("handmadePizza")}
            </h1>
          </div>
          <p className="text-lg text-white/90">
            {t("enjoyPizza")}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/85 px-3 py-1 font-bold text-slate-800">{t("ratings")}</span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-bold text-slate-800">{t("deliveryTime")}</span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-bold text-slate-800">{t("openUntil")}</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Link
              to={totals.count > 0 ? "/checkout" : "/menu"}
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-amber-700 transition hover:bg-slate-50 hover:shadow-lg"
            >
              <span>🛒</span> {t("orderNow")}
            </Link>
            <Link to="/menu" className="inline-flex items-center gap-2 rounded-full border-2 border-white text-white px-7 py-3.5 text-sm font-bold transition hover:bg-white/20">
              <span>🍽️</span> {t("viewMenu")}
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Oeffnungszeiten</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-bold uppercase tracking-wide">Mittwoch bis Samstag</p>
              <p className="mt-1 text-base font-semibold">17:30 - 22:00</p>
            </div>
            <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <p className="font-bold uppercase tracking-wide">Sonntag</p>
              <p className="mt-1 text-base font-semibold">17:00 - 22:00</p>
            </div>
            <div className="rounded-xl bg-red-50 p-3 dark:bg-red-950/30">
              <p className="font-bold uppercase tracking-wide text-red-700 dark:text-red-300">Montag & Dienstag</p>
              <p className="mt-1 text-base font-semibold text-red-700 dark:text-red-300">Ruhetag</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Lieferdienst</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-200">
            <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="font-bold uppercase tracking-wide">Freitag & Samstag</p>
              <p className="mt-1 text-base font-semibold">18:00 - 21:30</p>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-950/30">
              <p className="font-bold uppercase tracking-wide">Sonntag</p>
              <p className="mt-1 text-base font-semibold">17:30 - 21:30</p>
            </div>
            <div className="rounded-xl border border-amber-300 p-3 dark:border-amber-700">
              <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Mindestbestellwert: 25 EUR</p>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">Bitte ab 10 Gerichten fruehzeitig vorbestellen.</p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Liefergebiete</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {deliveryAreas.map((area) => (
              <span
                key={area}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {area}
              </span>
            ))}
          </div>
          <div className="mt-4 space-y-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-slate-700">
            <p className="font-bold text-slate-900 dark:text-slate-100">Anfahrtskosten</p>
            <p>2,00 EUR: Lemfoerde, Quernheim, Brockum, Huede, Stemshorn, Marl, Hagewede</p>
            <p>3,00 EUR: Dielingen</p>
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Telefon & Adresse</h2>
          <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">Bitte ab 10 Gerichten mind. 1 Tag im Voraus bestellen.</p>
          <div className="mt-4 space-y-2">
            <a href="tel:05443203770" className="block text-lg font-bold text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
              05443 / 20 37 70
            </a>
            <p className="text-sm text-slate-700 dark:text-slate-200">Hauptstr. 80</p>
            <p className="text-sm text-slate-700 dark:text-slate-200">49448 Lemfoerde</p>
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Pizzeria+Uno+Hauptstr.+80+49448+Lemfoerde"
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center rounded-full bg-amber-700 px-4 py-2 text-xs font-bold text-white transition hover:bg-amber-800"
          >
            Google Maps oeffnen
          </a>
          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <iframe
              title="Pizzeria Uno Google Maps"
              src="https://www.google.com/maps?q=Pizzeria+Uno+Hauptstr.+80+49448+Lemfoerde&output=embed"
              width="100%"
              height="280"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </article>

        <article className="rounded-2xl border border-red-300 bg-red-50 p-5 shadow-sm dark:border-red-700 dark:bg-red-950/20">
          <h2 className="text-xl font-black text-red-800 dark:text-red-300">Aktuelles</h2>
          <p className="mt-3 text-sm font-semibold text-red-700 dark:text-red-300">Hunde sind bei uns nicht erlaubt.</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            Wir haben vom 18.03.2026 bis zum 26.03.2026 geschlossen. Am 27.03.2026 sind wir wieder fuer Euch da.
          </p>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">Karte Highlights</h2>
          <ul className="mt-4 grid gap-2 text-sm text-slate-700 dark:text-slate-200">
            {menuHighlights.map((item) => (
              <li key={item} className="rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
                {item}
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Restaurant</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">
          Das denkmalgeschuetzte Gebaeude und das stimmungsvolle Interieur laden zu einem unvergesslichen Abend ein.
          Mehr als 60 Plaetze im Gewoelbekeller des Amtshofes haben wir fuer unsere Gaeste liebevoll hergerichtet.
          Im Sommer koennen Sie an rund 30 Aussensitzplaetzen das historische Gebaeude und den neu errichteten
          Buergerpark auf sich wirken lassen. Dazu servieren wir Ihnen mediterrane Koestlichkeiten von Salat bis Pizza,
          Pasta und Paninis. Fuer groessere Veranstaltungen bieten wir gerne besondere Angebote an.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("ourBestsellers")}</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{t("popularDishes")}</p>
          </div>
          <Link to="/menu" className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition">
            {t("allDishes")}
          </Link>
        </div>

        {loading ? (
          <SkeletonMenuGrid count={3} />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((item) => (
              <DishCard key={item._id} item={item} onAdd={addToCart} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;




