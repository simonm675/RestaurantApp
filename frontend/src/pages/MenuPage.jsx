import { motion } from "framer-motion";
import { Plus, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import DishCard from "../components/DishCard";
import { SkeletonMenuGrid } from "../components/SkeletonLoaders";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { menuApi } from "../services/api";

const CATEGORY_ORDER = ["Pizza", "Pasta", "Panini", "Salat", "Dessert", "Getraenke"];
const NAVBAR_OFFSET_PX = 96;
const CATEGORY_BAR_OFFSET_PX = 72;
const EXTRA_SCROLL_GAP_PX = 16;

const MenuPage = () => {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Pizza");
  const sectionRefs = useRef({});

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const { data } = await menuApi.getAll();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(items.map((item) => item.category))];

    const orderedKnown = CATEGORY_ORDER.filter((entry) => uniqueCategories.includes(entry));
    const orderedUnknown = uniqueCategories
      .filter((entry) => !CATEGORY_ORDER.includes(entry))
      .sort((a, b) => a.localeCompare(b, "de"));

    return [...orderedKnown, ...orderedUnknown, t("all")];
  }, [items, t]);

  const categoryItems = useMemo(() => {
    const term = search.toLowerCase();
    const map = new Map();

    categories.forEach((entry) => {
      if (entry === t("all")) return;
      map.set(
        entry,
        items
          .filter((item) => item.category === entry)
          .filter((item) => {
            if (!term) return true;
            return (
              item.name.toLowerCase().includes(term) ||
              item.description.toLowerCase().includes(term)
            );
          })
      );
    });

    return map;
  }, [categories, items, search, t]);

  const bestsellerItems = useMemo(
    () => items.filter((item) => item.featured).slice(0, 6),
    [items]
  );

  const scrollToCategory = (entry) => {
    setCategory(entry);
    if (entry === t("all")) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const section = sectionRefs.current[entry];
    if (!section) return;

    const y = section.getBoundingClientRect().top + window.scrollY;
    const offset = NAVBAR_OFFSET_PX + CATEGORY_BAR_OFFSET_PX + EXTRA_SCROLL_GAP_PX;
    window.scrollTo({ top: Math.max(0, y - offset), behavior: "smooth" });
  };

  const quickAdd = (item) => {
    addToCart(item);
  };

  const getSocialHint = (item, index) => {
    if (item.featured) return "Wird gerade oft bestellt";
    if (index % 3 === 0) return "Wird oft zusammen mit Getränken bestellt";
    if (index % 4 === 0) return "Schnell ausverkauft am Abend";
    return "Beliebt in deiner Nähe";
  };

  return (
    <div className="space-y-7">
      <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-6 shadow-sm dark:border-amber-900/30 dark:from-amber-950/20 dark:to-red-950/10">
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">{t("menuTitle")}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-white/80 px-3 py-1 font-semibold text-slate-700">⭐ 4.7 (2.3k Bewertungen)</span>
              <span className="rounded-full bg-white/80 px-3 py-1 font-semibold text-slate-700">⏱️ 20-35 min Lieferzeit</span>
              <span className="rounded-full bg-white/80 px-3 py-1 font-semibold text-slate-700">💸 Ab 20 € Mindestbestellwert</span>
            </div>
          </div>
          <label className="relative block">
            <Search className="absolute left-4 top-3.5 text-amber-400" size={18} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-xl border-2 border-amber-200 bg-white py-3 pl-11 pr-4 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-amber-700 dark:bg-slate-800 dark:focus:border-amber-500"
            />
          </label>
        </div>
      </div>

      <div className="sticky top-24 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">{t("filterByCategory")}</p>
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {categories.map((entry) => (
            <button
              key={entry}
              onClick={() => scrollToCategory(entry)}
              className={`inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
                category === entry
                  ? "bg-gradient-to-r from-amber-700 to-red-700 text-white"
                  : "border border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
              }`}
            >
              {entry}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <SkeletonMenuGrid count={9} />
      ) : (
        <>
          {bestsellerItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Star size={18} className="text-amber-500" />
                <h2 className="text-xl font-bold">Bestseller</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bestsellerItems.map((item) => (
                  <motion.article
                    key={`best-${item._id}`}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm dark:border-amber-800 dark:bg-slate-900"
                  >
                    <img src={item.image} alt={item.name} loading="lazy" className="h-36 w-full rounded-xl object-cover" />
                    <div className="mt-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.description}</p>
                      </div>
                      <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-700">Beliebt</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-black text-slate-900 dark:text-slate-100">{Number(item.price).toFixed(2)} €</p>
                      <motion.button
                        type="button"
                        whileTap={{ scale: 0.92 }}
                        onClick={() => quickAdd(item)}
                        className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-700 to-red-700 px-3 py-1.5 text-xs font-bold text-white"
                      >
                        <Plus size={14} />
                        Hinzufügen
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </div>
            </section>
          )}

          {categories
            .filter((entry) => entry !== t("all"))
            .map((entry) => {
              const list = categoryItems.get(entry) || [];
              if (list.length === 0) return null;

              return (
                <section
                  key={entry}
                  ref={(el) => {
                    sectionRefs.current[entry] = el;
                  }}
                  className="scroll-mt-56 space-y-3"
                >
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{entry}</h3>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {list.map((item, index) => (
                      <div key={item._id} className="space-y-1">
                        <DishCard item={item} onAdd={addToCart} />
                        <p className="px-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                          {getSocialHint(item, index)}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
        </>
      )}
    </div>
  );
};

export default MenuPage;



