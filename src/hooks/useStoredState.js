import { useCallback, useEffect, useRef, useState } from "react";
import { storage } from "../services/storage.js";

const identity = (v) => v;

/**
 * useState mit asynchroner Persistenz. Liefert [value, setValue, loaded].
 * Für Strings `{raw:true}` übergeben (keine JSON-Serialisierung).
 */
export function useStoredState(key, initialValue, { raw = false } = {}) {
  const serialize = raw ? identity : JSON.stringify;
  const deserialize = raw ? identity : JSON.parse;
  const [value, setValue] = useState(initialValue);
  const [loaded, setLoaded] = useState(false);
  const serializeRef = useRef(serialize);
  serializeRef.current = serialize;

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const stored = await storage.get(key);
        if (active && stored != null) setValue(deserialize(stored));
      } catch { /* korrupter Eintrag – Initialwert behalten */ }
      if (active) setLoaded(true);
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const set = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        storage.set(key, serializeRef.current(resolved));
        return resolved;
      });
    },
    [key]
  );

  return [value, set, loaded];
}
