import React, { useMemo, useCallback } from "react";

/**
 * OPTIMIERTE KOMPONENTE BEISPIEL
 * 
 * ✅ Techniken:
 * - React.memo() - Verhindert Default Re-Renders
 * - useMemo() - Memoize teure Berechnungen
 * - useCallback() - Stabile Callback-Referenzen
 *
 * Vorher:  Alle Child-Komponenten re-render bei jedem Parent-Render
 * Nachher: Child re-render nur wenn Props sich WIRKLICH ändern
 */

// ❌ NICHT-optimiert
export const DishCardBad = ({ item, onAdd }) => {
  // ⚠️ Problem: formatPrice wird bei jedem Render berechnet
  const formattedPrice = `€${item.price.toFixed(2)}`;

  // ⚠️ Problem: handleClick Function ist neue Referenz bei jedem Render
  //           → erzwingt Re-Render von Child-Komponenten
  const handleClick = () => {
    onAdd(item);
  };

  return (
    <div>
      <h3>{item.name}</h3>
      <p>{formattedPrice}</p>
      <button onClick={handleClick}>Hinzufügen</button>
    </div>
  );
};

// ✅ OPTIMIERT
const DishCardOptimized = React.memo(({ item, onAdd }) => {
  // Memoize teure Berechnungen
  const formattedPrice = useMemo(() => {
    return `€${item.price.toFixed(2)}`;
  }, [item.price]);

  // useCallback = stabile Callback-Referenz
  const handleClick = useCallback(() => {
    onAdd(item);
  }, [item, onAdd]);

  return (
    <div>
      <h3>{item.name}</h3>
      <p>{formattedPrice}</p>
      <button onClick={handleClick}>Hinzufügen</button>
    </div>
  );
});

DishCardOptimized.displayName = "DishCard";

export default DishCardOptimized;

/**
 * REACT.MEMO best practices:
 * 
 * 1. Nutze react.memo() NUR wenn die Komponente:
 *    - Props-basiert ist (keine External State)
 *    - teure Renders hat (komplexe Kalkulationen)
 *    - häufig mit gleichen Props aufgerufen wird
 *
 * 2. Custom Comparison:
 *    React.memo(Component, (prevProps, nextProps) => {
 *      // return true wenn NICHTS sich geändert hat (gleich halten)
 *      return prevProps.id === nextProps.id;
 *    })
 *
 * 3. Callback Props IMMER mit useCallback memoizen:
 *    const handleClick = useCallback(() => { ... }, [deps])
 *    Sonst: React.memo hat KEINEN Effekt!
 */

/**
 * PROFILING TIP:
 * 
 * Chrome DevTools → Performance → Record
 * → Suche nach Components die länger als 1ms rendern
 * 
 * Or use Profiler:
 * import { Profiler } from 'react';
 * <Profiler id="MyComponent" onRender={onRenderCallback}>
 * </Profiler>
 */
