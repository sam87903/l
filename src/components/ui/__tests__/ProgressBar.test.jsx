import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import ProgressBar from "../ProgressBar.jsx";

describe("ProgressBar", () => {
  it("zeigt den Fortschritt als ARIA-Wert", () => {
    render(<ProgressBar value={7} max={21} label="Lernfortschritt" />);
    const bar = screen.getByRole("progressbar", { name: "Lernfortschritt" });
    expect(bar).toHaveAttribute("aria-valuenow", "33");
  });

  it("begrenzt Werte auf 0–100", () => {
    render(<ProgressBar value={500} max={100} label="Überlauf" />);
    expect(screen.getByRole("progressbar", { name: "Überlauf" })).toHaveAttribute("aria-valuenow", "100");
  });
});
