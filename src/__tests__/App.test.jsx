import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "../App.jsx";

describe("App", () => {
  it("rendert das Dashboard nach dem Laden", async () => {
    render(<App />);
    expect(await screen.findByText(/Salam, bereit zu lernen\?/i)).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Hauptnavigation" })).toBeInTheDocument();
    expect(screen.getAllByText(/Marokko-Lernplan/i).length).toBeGreaterThan(0);
  });
});
