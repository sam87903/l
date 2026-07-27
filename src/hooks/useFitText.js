import { useLayoutEffect, useRef, useState } from "react";

/**
 * Passt die Schriftgröße so an, dass eine Zeile fester Zeichenzahl in die
 * verfügbare Breite passt – gedacht für Formeln in Festbreitenschrift.
 *
 * Ohne das brachen längere Formeln mitten im Ausdruck um („Wirtschaftlichkeit
 * = Ertrag :" / „Aufwand"), was schwer zu lesen ist. Gemessen wird das
 * Element selbst, nicht die Fensterbreite: Auf breiten Bildschirmen sitzt
 * links die Navigationsleiste, und eine Rechnung über 100vw läge daneben.
 *
 * @param {number} chars  längste Zeile in Zeichen
 * @param {{max?:number, min?:number, ratio?:number}} opts Grenzen in px;
 *        `ratio` ist das Verhältnis Zeichenbreite zu Schriftgröße der
 *        Festbreitenschrift (gemessen: ~0,60).
 */
export function useFitText(chars, { max = 12.8, min = 8.4, ratio = 0.62 } = {}) {
  const ref = useRef(null);
  const [size, setSize] = useState(max);
  // Reicht selbst die kleinste Schrift nicht, wird seitlich geschoben. Das
  // muss sichtbar sein – sonst wirkt die Formel einfach abgeschnitten.
  const [overflowing, setOverflowing] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !chars) return;

    const messen = () => {
      const cs = getComputedStyle(el);
      const innen =
        el.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      if (innen <= 0) return;
      // Ein Pixel Luft, damit das letzte Zeichen nicht am Rand klebt.
      const passend = Math.max(min, Math.min(max, (innen - 1) / (chars * ratio)));
      setSize(passend);
      setOverflowing(chars * ratio * passend > innen);
    };

    messen();
    // Die Schriftgröße ändert nur die Höhe, nicht die Breite – keine Schleife.
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(messen) : null;
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [chars, max, min, ratio]);

  return [ref, size, overflowing];
}
