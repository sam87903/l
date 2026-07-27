import { beforeEach, describe, expect, it } from "vitest";
import {
  NEURAL_VOICE,
  NEURAL_WORKER_SRC,
  isNeuralVoiceStored,
  neuralVoiceProven,
} from "./neuralTts.js";

/**
 * Die eigentliche Synthese lässt sich hier nicht prüfen – sie braucht vier
 * fremde Hosts und WebAssembly. Getestet wird deshalb das, was in der
 * Vergangenheit tatsächlich falsch war: die Verwechslung von „Modell liegt
 * da" mit „Stimme spricht", und ein Worker-Quelltext, der als Zeichenkette
 * unbemerkt kaputtgehen kann.
 */
describe("neuralTts", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Merker", () => {
    it("meldet ohne Eintrag weder gespeichert noch erprobt", () => {
      expect(isNeuralVoiceStored()).toBe(false);
      expect(neuralVoiceProven()).toBe(false);
    });

    it("trennt gespeichertes Modell und erprobte Stimme", () => {
      // Genau dieser Fall führte zur Falschaussage „startet sofort":
      // Download geglückt, gesprochen hat die Stimme trotzdem nie.
      localStorage.setItem("mrk7-voice-ready", NEURAL_VOICE);
      expect(isNeuralVoiceStored()).toBe(true);
      expect(neuralVoiceProven()).toBe(false);

      localStorage.setItem("mrk7-voice-works", "1");
      expect(neuralVoiceProven()).toBe(true);
    });

    it("erkennt ein Modell für eine andere Stimme nicht als passend", () => {
      localStorage.setItem("mrk7-voice-ready", "de_DE-thorsten-low");
      expect(isNeuralVoiceStored(NEURAL_VOICE)).toBe(false);
    });
  });

  describe("Quelltext des Hintergrundprozesses", () => {
    it("ist syntaktisch gültiges JavaScript", () => {
      // Als Zeichenkette prüft kein Werkzeug den Code – ein Tippfehler fiele
      // sonst erst im Browser auf, und dort nur als stumme Stimme.
      expect(() => new Function(NEURAL_WORKER_SRC)).not.toThrow();
    });

    it("beantwortet alle drei Befehle, die der Dienst schickt", () => {
      for (const cmd of ["stored", "download", "predict"]) {
        expect(NEURAL_WORKER_SRC).toContain(`d.cmd === "${cmd}"`);
      }
    });

    it("meldet Fehler zurück, statt sie zu verschlucken", () => {
      expect(NEURAL_WORKER_SRC).toContain("ok: false");
    });
  });
});
