import { useEffect, useState } from "react";

/** Wert erst nach `delay` ms Ruhe übernehmen (z.B. für Live-Suche). */
export function useDebouncedValue(value, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
