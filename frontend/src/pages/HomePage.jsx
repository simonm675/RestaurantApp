import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DishCard from "../components/DishCard";
import { SkeletonMenuGrid } from "../components/SkeletonLoaders";
import { useCart } from "../context/CartContext";
import { menuApi } from "../services/api";
import pizzeriaLogo from "../assets/pizzeria-uno-logo.svg";

const HomePage = () => {
  const { addToCart } = useCart();
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
        <div className="pointer-events-none absolute right-4 top-4 rounded-2xl bg-white/92 p-2.5 shadow-2xl ring-1 ring-amber-800/30">
          <img src={pizzeriaLogo} alt="Pizzeria Uno" className="h-24 w-auto sm:h-32" />
        </div>
        <div className="relative z-10 max-w-2xl space-y-5">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-white/85">🍕 Authentic Italian Pizzeria</p>
            <h1 className="mt-2 text-5xl font-black leading-tight text-white md:text-6xl">
              Handgemachte Pizza,
              <br />
              frisch aus dem Ofen.
            </h1>
          </div>
          <p className="text-lg text-white/90">
            Genießen Sie unsere authentischen italienischen Pizzas, frische Salate und köstliche Pasta. Zutaten von höchster Qualität – traditionelle Rezepte.
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/85 px-3 py-1 font-bold text-slate-800">⭐ 4.7 (2.3k Bewertungen)</span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-bold text-slate-800">⏱️ Lieferung 20-35 min</span>
            <span className="rounded-full bg-white/85 px-3 py-1 font-bold text-slate-800">🕒 Geöffnet bis 23:00</span>
          </div>
          <div className="flex flex-wrap gap-3 pt-4">
            <Link to="/checkout" className="inline-flex items-center gap-2 rounded-full bg-white text-amber-700 px-7 py-3.5 text-sm font-bold transition hover:bg-slate-50 hover:shadow-lg">
              <span>🛒</span> Jetzt bestellen
            </Link>
            <Link to="/menu" className="inline-flex items-center gap-2 rounded-full border-2 border-white text-white px-7 py-3.5 text-sm font-bold transition hover:bg-white/20">
              <span>🍽️</span> Menü ansehen
            </Link>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🌟 Unsere Bestseller</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Die beliebtesten Pizzas und Spezialitäten</p>
          </div>
          <Link to="/menu" className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/30 px-4 py-2 text-sm font-bold text-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition">
            Alle Gerichte →
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



