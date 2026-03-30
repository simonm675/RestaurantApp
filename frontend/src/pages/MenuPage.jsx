import { Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import DishCard from "../components/DishCard";
import { SkeletonMenuGrid } from "../components/SkeletonLoaders";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { menuApi } from "../services/api";

const CATEGORY_ORDER = ["Pizza", "Pasta", "Panini", "Salat", "Dessert", "Getraenke"];
const NAVBAR_OFFSET_PX = 124;
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

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-red-50 p-4 shadow-sm dark:border-amber-900/30 dark:from-amber-950/20 dark:to-red-950/10">
        <div className="space-y-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t("menuTitle")}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800">⭐ 4.7</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800">⏱️ 20-35 min</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/85 px-2.5 py-0.5 font-semibold text-slate-700 dark:bg-slate-800">💸 Ab 20 €</span>
            </div>
          </div>
          <label className="relative block">
            <Search className="absolute left-3.5 top-2.5 text-amber-400" size={16} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border-2 border-amber-200 bg-white py-2 pl-10 pr-3 text-sm outline-none ring-amber-300 transition focus:border-amber-400 focus:ring dark:border-amber-700 dark:bg-slate-800 dark:focus:border-amber-500"
            />
          </label>
        </div>
      </div>

      <div className="sticky top-[108px] sm:top-[116px] z-10 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <div className="flex gap-1.5 overflow-x-auto pb-0.5 -mx-2 px-2">
          {categories.map((entry) => (
            <button
              key={entry}
              onClick={() => scrollToCategory(entry)}
              className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                category === entry
                  ? "bg-gradient-to-r from-amber-700 to-red-700 text-white shadow-md"
                  : "border border-slate-200 text-slate-700 hover:border-amber-300 dark:border-slate-700 dark:text-slate-200"
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
                <h2 className="text-xl font-bold">{t("bestsellers")}</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {bestsellerItems.map((item) => (
                  <DishCard key={`best-${item._id}`} item={item} onAdd={addToCart} />
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
                    {list.map((item) => (
                      <div key={item._id}>
                        <DishCard item={item} onAdd={addToCart} />
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




