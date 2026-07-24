import { useCallback, useEffect, useRef, useState } from "react";

const SWIPE_DISTANCE = 70; // px – ab hier zählt es allein durch die Strecke
const SWIPE_VELOCITY = 0.5; // px/ms – schnelles Schnippen genügt …
const MIN_FLICK = 32; // … aber erst ab dieser Mindeststrecke (sonst lösen
                      // winzige, schnelle Zuckungen schon aus)
const TAP_SLOP = 8; // px – darunter ist es ein Tippen, kein Ziehen
const ELASTIC = 0.7; // Zieh-Widerstand
const VELOCITY_WINDOW_MS = 90; // Geschwindigkeit aus der letzten Bewegung,
                               // nicht über die gesamte Gestendauer mitteln

/**
 * Lernkarten-Geste ohne Animations-Bibliothek: horizontal ziehen (wischen)
 * und antippen zum Umdrehen – mit nativen Pointer-Events für Maus und Touch.
 *
 * Bewegung und Loslassen werden bewusst am `window` verfolgt, nicht am
 * Element: Sobald React während des Ziehens neu rendert, verliert das
 * Element sonst die Zeigerverfolgung, das Loslassen käme nie an – und die
 * zweite Wischgeste in Folge bliebe wirkungslos.
 *
 * Der Zieh-Versatz landet als CSS-Variable `--swipe` am Element; das
 * Zurückfedern übernimmt CSS. Beim Loslassen entscheidet Strecke ODER
 * Geschwindigkeit, ob `onSwipe("left"|"right")` feuert.
 */
export function useSwipeCard({ onSwipe, onTap }) {
  const [dragging, setDragging] = useState(false);
  const ref = useRef(null);
  const gesture = useRef(null);
  // Callbacks über Refs, damit die window-Listener immer die aktuellen
  // Handler sehen, ohne bei jedem Render neu registriert zu werden.
  const cbs = useRef({ onSwipe, onTap });
  cbs.current = { onSwipe, onTap };

  const setOffset = useCallback((px) => {
    if (ref.current) ref.current.style.setProperty("--swipe", `${px}px`);
  }, []);

  const end = useCallback(
    (clientX, cancelled) => {
      const g = gesture.current;
      gesture.current = null;
      setDragging(false);
      setOffset(0);
      if (!g || cancelled) return;
      if (!g.moved) {
        cbs.current.onTap?.();
        return;
      }
      const dx = clientX - g.x;
      // Geschwindigkeit nur werten, wenn sie frisch ist (echtes Schnippen am
      // Ende) und eine Mindeststrecke zurückgelegt wurde.
      const fresh = performance.now() - g.lastT <= VELOCITY_WINDOW_MS;
      const v = fresh && Math.abs(dx) >= MIN_FLICK ? g.vx : 0;
      if (dx > SWIPE_DISTANCE || v > SWIPE_VELOCITY) cbs.current.onSwipe?.("right");
      else if (dx < -SWIPE_DISTANCE || v < -SWIPE_VELOCITY) cbs.current.onSwipe?.("left");
    },
    [setOffset]
  );

  // Bewegung/Loslassen global verfolgen, solange gezogen wird.
  useEffect(() => {
    const onMove = (e) => {
      const g = gesture.current;
      if (!g) return;
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      // Vertikales Scrollen gewinnt: Geste verwerfen.
      if (!g.moved && Math.abs(dy) > Math.abs(dx)) {
        gesture.current = null;
        setOffset(0);
        setDragging(false);
        return;
      }
      if (!g.moved && Math.abs(dx) < TAP_SLOP) return;
      g.moved = true;
      const now = performance.now();
      const dt = now - g.lastT;
      if (dt > 0) {
        g.vx = (e.clientX - g.lastX) / dt;
        g.lastX = e.clientX;
        g.lastT = now;
      }
      setDragging(true);
      setOffset(dx * ELASTIC);
    };
    const onUp = (e) => {
      if (gesture.current) end(e.clientX, false);
    };
    const onCancel = () => {
      if (gesture.current) end(0, true);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [end, setOffset]);

  const onPointerDown = useCallback((e) => {
    // Nur primäre Taste / einzelner Finger.
    if (e.button != null && e.button !== 0) return;
    const now = performance.now();
    gesture.current = { x: e.clientX, y: e.clientY, moved: false, lastX: e.clientX, lastT: now, vx: 0 };
  }, []);

  return {
    dragging,
    /** Auf das Karten-Element spreaden. */
    handlers: { ref, onPointerDown },
  };
}
