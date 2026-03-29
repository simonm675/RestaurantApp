import { useEffect, useMemo, useState } from "react";
import fallbackImage from "../assets/hero.png";

const toMoney = (value) => Number(Number(value).toFixed(2));

const getOptionConfig = (item) => {
  const category = String(item.category || "").toLowerCase();

  if (category === "pizza") {
    return {
      sections: [
        {
          id: "size",
          label: "Groesse",
          type: "single",
          required: true,
          options: [
            { value: "22 cm", label: "22 cm", price: 0 },
            { value: "28 cm", label: "28 cm", price: 2.5 },
          ],
        },
        {
          id: "dough",
          label: "Teigart",
          type: "single",
          required: true,
          options: [
            { value: "klassisch", label: "Klassisch", price: 0 },
            { value: "duenn", label: "Duenner Teig", price: 0 },
            { value: "luftig", label: "Luftig", price: 0.8 },
          ],
        },
        {
          id: "extraToppings",
          label: "Extra Belaege",
          type: "multi",
          required: false,
          maxSelect: 4,
          options: [
            { value: "extra-kaese", label: "Extra Kaese", price: 1.5 },
            { value: "champignons", label: "Champignons", price: 1.2 },
            { value: "oliven", label: "Oliven", price: 1.1 },
            { value: "rote-zwiebeln", label: "Rote Zwiebeln", price: 0.9 },
            { value: "jalapenos", label: "Jalapenos", price: 1.0 },
            { value: "salami", label: "Extra Salami", price: 1.8 },
          ],
        },
      ],
    };
  }

  if (category === "pasta") {
    return {
      sections: [
        {
          id: "portion",
          label: "Portionsgroesse",
          type: "single",
          required: true,
          options: [
            { value: "normal", label: "Normal", price: 0 },
            { value: "gross", label: "Gross", price: 2.0 },
          ],
        },
        {
          id: "cheese",
          label: "Kaese-Topping",
          type: "single",
          required: false,
          options: [
            { value: "keiner", label: "Kein extra Kaese", price: 0 },
            { value: "parmesan", label: "Parmesan", price: 0.9 },
            { value: "pecorino", label: "Pecorino", price: 1.2 },
          ],
        },
        {
          id: "pastaExtras",
          label: "Extras",
          type: "multi",
          required: false,
          maxSelect: 3,
          options: [
            { value: "extra-sosse", label: "Extra Sosse", price: 1.0 },
            { value: "brokkoli", label: "Brokkoli", price: 1.2 },
            { value: "huhn", label: "Haehnchen", price: 2.5 },
            { value: "chili", label: "Chili", price: 0.5 },
          ],
        },
      ],
    };
  }

  if (category === "panini") {
    return {
      sections: [
        {
          id: "bread",
          label: "Brot",
          type: "single",
          required: true,
          options: [
            { value: "klassisch", label: "Klassisch", price: 0 },
            { value: "vollkorn", label: "Vollkorn", price: 0.6 },
          ],
        },
        {
          id: "toastLevel",
          label: "Roestgrad",
          type: "single",
          required: true,
          options: [
            { value: "normal", label: "Normal", price: 0 },
            { value: "kross", label: "Kross", price: 0 },
          ],
        },
        {
          id: "paniniExtras",
          label: "Extras",
          type: "multi",
          required: false,
          maxSelect: 3,
          options: [
            { value: "extra-kaese", label: "Extra Kaese", price: 1.2 },
            { value: "knoblauch", label: "Knoblauch", price: 0.7 },
            { value: "jalapenos", label: "Jalapenos", price: 1.0 },
            { value: "aioli", label: "Aioli", price: 0.8 },
          ],
        },
      ],
    };
  }

  if (category === "salat") {
    return {
      sections: [
        {
          id: "dressing",
          label: "Dressing",
          type: "single",
          required: true,
          options: [
            { value: "italienisch", label: "Italienisch", price: 0 },
            { value: "joghurt", label: "Joghurt", price: 0 },
            { value: "balsamico", label: "Balsamico", price: 0 },
          ],
        },
        {
          id: "saladExtras",
          label: "Toppings",
          type: "multi",
          required: false,
          maxSelect: 4,
          options: [
            { value: "feta", label: "Feta", price: 1.5 },
            { value: "thunfisch", label: "Thunfisch", price: 2.0 },
            { value: "oliven", label: "Oliven", price: 1.0 },
            { value: "croutons", label: "Croutons", price: 0.8 },
          ],
        },
      ],
    };
  }

  if (category === "dessert") {
    return {
      sections: [
        {
          id: "dessertStyle",
          label: "Servierart",
          type: "single",
          required: true,
          options: [
            { value: "klassisch", label: "Klassisch", price: 0 },
            { value: "extra-kakao", label: "Extra Kakao", price: 0.5 },
            { value: "mit-fruchtsauce", label: "Mit Fruchtsauce", price: 0.9 },
          ],
        },
      ],
    };
  }

  if (category === "getraenke") {
    return {
      sections: [
        {
          id: "drinkTemp",
          label: "Temperatur",
          type: "single",
          required: true,
          options: [
            { value: "eiskalt", label: "Eiskalt", price: 0 },
            { value: "normal", label: "Normal", price: 0 },
          ],
        },
        {
          id: "drinkExtras",
          label: "Zusatz",
          type: "multi",
          required: false,
          maxSelect: 2,
          options: [
            { value: "eiswuerfel", label: "Eiswuerfel", price: 0.2 },
            { value: "zitrone", label: "Zitrone", price: 0.3 },
          ],
        },
      ],
    };
  }

  return {
    sections: [
      {
        id: "extras",
        label: "Extras",
        type: "multi",
        required: false,
        maxSelect: 2,
        options: [
          { value: "knoblauch", label: "Knoblauch", price: 0.7 },
          { value: "scharf", label: "Scharf", price: 0 },
        ],
      },
    ],
  };
};

const buildInitialSelections = (config) => {
  const state = {};
  config.sections.forEach((section) => {
    if (section.type === "single") {
      state[section.id] = section.options[0]?.value || "";
    } else {
      state[section.id] = [];
    }
  });
  return state;
};

const DishCard = ({ item, onAdd, adminActions }) => {
  const [configOpen, setConfigOpen] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const optionConfig = useMemo(() => getOptionConfig(item), [item]);
  const [selections, setSelections] = useState(() => buildInitialSelections(optionConfig));

  useEffect(() => {
    setSelections(buildInitialSelections(optionConfig));
    setSpecialInstructions("");
  }, [optionConfig]);

  const selectedOptions = useMemo(() => {
    const options = [];

    optionConfig.sections.forEach((section) => {
      if (section.type === "single") {
        const selectedValue = selections[section.id];
        const selected = section.options.find((entry) => entry.value === selectedValue);
        if (!selected) return;
        options.push({
          label: section.label,
          value: selected.label,
          price: toMoney(selected.price),
        });
      }

      if (section.type === "multi") {
        const selectedValues = Array.isArray(selections[section.id]) ? selections[section.id] : [];
        section.options.forEach((entry) => {
          if (selectedValues.includes(entry.value)) {
            options.push({
              label: section.label,
              value: entry.label,
              price: toMoney(entry.price),
            });
          }
        });
      }
    });

    return options;
  }, [optionConfig, selections]);

  const isConfigValid = useMemo(() => {
    return optionConfig.sections.every((section) => {
      if (!section.required) return true;
      if (section.type === "single") return Boolean(selections[section.id]);
      return Array.isArray(selections[section.id]) && selections[section.id].length > 0;
    });
  }, [optionConfig, selections]);

  const configuredUnitPrice = useMemo(() => {
    const optionTotal = selectedOptions.reduce((acc, option) => acc + option.price, 0);
    return toMoney(item.price + optionTotal);
  }, [item.price, selectedOptions]);

  const resetConfigurator = () => {
    setSelections(buildInitialSelections(optionConfig));
    setSpecialInstructions("");
  };

  const handleSingleSelect = (sectionId, value) => {
    setSelections((prev) => ({ ...prev, [sectionId]: value }));
  };

  const handleMultiToggle = (section, value) => {
    setSelections((prev) => {
      const current = Array.isArray(prev[section.id]) ? prev[section.id] : [];
      if (current.includes(value)) {
        return {
          ...prev,
          [section.id]: current.filter((entry) => entry !== value),
        };
      }

      if (section.maxSelect && current.length >= section.maxSelect) {
        return prev;
      }

      return {
        ...prev,
        [section.id]: [...current, value],
      };
    });
  };

  const handleQuickAdd = () => {
    onAdd(item, { selectedOptions: [], specialInstructions: "" });
  };

  const handleConfiguredAdd = () => {
    if (!isConfigValid) return;
    onAdd(item, { selectedOptions, specialInstructions, unitPrice: configuredUnitPrice });
    setConfigOpen(false);
    resetConfigurator();
  };

  const onImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = fallbackImage;
  };

  return (
    <>
      <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-md transition duration-300 hover:border-amber-300 hover:shadow-xl dark:border-slate-700 dark:bg-slate-900/95 dark:hover:border-amber-600">
        <div className="relative h-44 overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={item.image?.trim() || fallbackImage}
            alt={item.name}
            loading="lazy"
            onError={onImageError}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition group-hover:opacity-100" />
        </div>
        <div className="flex flex-1 flex-col space-y-3 p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 text-base dark:text-slate-100 line-clamp-1">{item.name}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.category}</p>
            </div>
            <span className="rounded-lg bg-amber-100 dark:bg-red-950/20 px-2.5 py-1 text-sm font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
              {item.price.toFixed(2)} €
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{item.description}</p>
          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            {item.featured && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/30 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:text-amber-300">
                ⭐ Featured
              </span>
            )}
            {!adminActions && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={handleQuickAdd}
                  className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-bold text-amber-700 transition hover:bg-amber-50 dark:border-amber-700 dark:bg-slate-900 dark:text-amber-300 dark:hover:bg-amber-950/20"
                >
                  Schnell +
                </button>
                <button
                  onClick={() => setConfigOpen(true)}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 hover:shadow-lg"
                >
                  Optionen
                </button>
              </div>
            )}
            {adminActions && <div className="flex gap-2 ml-auto">{adminActions}</div>}
          </div>
        </div>
      </article>

      {configOpen && !adminActions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{item.name} konfigurieren</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">Waehle Optionen wie bei Lieferdiensten.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setConfigOpen(false);
                  resetConfigurator();
                }}
                className="rounded-md px-2 py-1 text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {optionConfig.sections.map((section) => (
              <div key={section.id} className="mt-4 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {section.label}
                  {section.required ? " *" : ""}
                  {section.type === "multi" && section.maxSelect
                    ? ` (max ${section.maxSelect})`
                    : ""}
                </p>

                {section.type === "single" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {section.options.map((entry) => (
                      <label
                        key={`${section.id}-${entry.value}`}
                        className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                          selections[section.id] === entry.value
                            ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-950/20 dark:text-amber-300"
                            : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                        }`}
                      >
                        <span>{entry.label}</span>
                        <span className="font-semibold">
                          {entry.price > 0 ? `+${entry.price.toFixed(2)} €` : "inkl."}
                        </span>
                        <input
                          type="radio"
                          name={`${section.id}-${item._id}`}
                          checked={selections[section.id] === entry.value}
                          onChange={() => handleSingleSelect(section.id, entry.value)}
                          className="hidden"
                        />
                      </label>
                    ))}
                  </div>
                )}

                {section.type === "multi" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    {section.options.map((entry) => {
                      const selectedValues = Array.isArray(selections[section.id])
                        ? selections[section.id]
                        : [];
                      const selected = selectedValues.includes(entry.value);
                      const limitReached =
                        !selected &&
                        section.maxSelect &&
                        selectedValues.length >= section.maxSelect;

                      return (
                        <label
                          key={`${section.id}-${entry.value}`}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 text-sm ${
                            selected
                              ? "border-amber-500 bg-amber-50 text-amber-800 dark:border-amber-400 dark:bg-amber-950/20 dark:text-amber-300"
                              : "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-200"
                          } ${limitReached ? "opacity-50" : ""}`}
                        >
                          <span>{entry.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">
                              {entry.price > 0 ? `+${entry.price.toFixed(2)} €` : "gratis"}
                            </span>
                            <input
                              type="checkbox"
                              checked={selected}
                              disabled={limitReached}
                              onChange={() => handleMultiToggle(section, entry.value)}
                              className="accent-amber-700"
                            />
                          </div>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Notiz (optional)</p>
              <textarea
                value={specialInstructions}
                onChange={(event) => setSpecialInstructions(event.target.value)}
                rows={3}
                maxLength={180}
                placeholder="z.B. gut durchbacken, bitte ohne Zwiebeln"
                className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-800 outline-none ring-amber-300 focus:border-amber-400 focus:ring dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Stueckpreis: <span className="font-black text-amber-700 dark:text-amber-300">{configuredUnitPrice.toFixed(2)} €</span>
              </p>
              <button
                type="button"
                onClick={handleConfiguredAdd}
                disabled={!isConfigValid}
                className="rounded-lg bg-gradient-to-r from-amber-700 to-red-700 px-5 py-2.5 text-sm font-bold text-white transition hover:from-amber-800 hover:to-red-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Mit Optionen hinzufuegen
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DishCard;



