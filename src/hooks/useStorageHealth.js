import { useEffect, useState } from "react";
import { getStorageError, onStorageError } from "../services/storage.js";

/**
 * Meldet, ob das Speichern gerade scheitert ("quota" | "blocked" | null).
 * Die App speichert sonst still ins Leere – gerade offline würde das erst
 * auffallen, wenn der Fortschritt schon weg ist.
 */
export function useStorageHealth() {
  const [error, setError] = useState(() => getStorageError());
  useEffect(() => onStorageError(setError), []);
  return error;
}
