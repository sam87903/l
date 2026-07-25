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

  // Aktueller Wert als Ref, damit der Updater rein bleiben kann: Das
  // Speichern darf nicht im State-Updater passieren – React ruft ihn unter
  // Umständen mehrfach auf, was doppelte Schreibvorgänge auslöst.
  const valueRef = useRef(value);
  valueRef.current = value;

  const set = useCallback(
    (next) => {
      const resolved = typeof next === "function" ? next(valueRef.current) : next;
      valueRef.current = resolved;
      setValue(resolved);
      storage.set(key, serializeRef.current(resolved));
    },
    [key]
  );

  return [value, set, loaded];
}
