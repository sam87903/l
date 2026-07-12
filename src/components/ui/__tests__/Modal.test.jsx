import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import Modal from "../Modal.jsx";

describe("Modal", () => {
  it("verknüpft Titel und Text per ARIA", () => {
    render(
      <Modal open title="Wirklich löschen?" confirmLabel="Ja" onConfirm={() => {}} onClose={() => {}}>
        Das kann nicht rückgängig gemacht werden.
      </Modal>
    );
    const dialog = screen.getByRole("dialog", { name: "Wirklich löschen?" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("legt den Fokus auf die Bestätigungsaktion", async () => {
    render(
      <Modal open title="Backup laden?" confirmLabel="Wiederherstellen" onConfirm={() => {}} onClose={() => {}}>
        Inhalt
      </Modal>
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Wiederherstellen" })).toHaveFocus()
    );
  });

  it("schließt bei Escape", () => {
    const onClose = vi.fn();
    render(
      <Modal open title="Test" onConfirm={() => {}} onClose={onClose}>
        Inhalt
      </Modal>
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
