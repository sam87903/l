import { useCallback, useEffect, useRef, useState } from "react";
import { LIST_CHUNK } from "../constants/config.js";

/**
 * Inkrementelles Rendern langer Listen: zeigt zunächst `chunk` Einträge
 * und lädt beim Scrollen nach (IntersectionObserver). Fallback: alles.
 */
export function useIncrementalList(items, chunk = LIST_CHUNK) {
  const [count, setCount] = useState(chunk);
  const sentinelRef = useRef(null);

  // Für Sprungziele (z. B. Alpha-Navigation): sofort so viele Einträge
  // rendern, dass Index `n-1` sichtbar wird – nie wieder schrumpfen.
  const expandTo = useCallback(
    (n) => setCount((c) => Math.max(c, Math.min(items.length, n))),
    [items.length]
  );

  useEffect(() => setCount(chunk), [items, chunk]);

  useEffect(() => {
    if (count >= items.length) return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setCount(items.length);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setCount((c) => Math.min(items.length, c + chunk));
        }
      },
      { rootMargin: "800px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [count, items, chunk]);

  return { visible: items.slice(0, count), sentinelRef, done: count >= items.length, expandTo };
}
