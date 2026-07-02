import { Component } from "react";
import GlassCard from "./GlassCard.jsx";
import styles from "./ui.module.css";

/** Fängt Renderfehler ab und zeigt eine freundliche Wiederherstellung. */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unerwarteter Fehler:", error, info);
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <GlassCard tint="#ff6b6b" className={styles.errorBox}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }} aria-hidden="true">😵</div>
        <h2 style={{ margin: "0 0 0.5rem", fontSize: "var(--fs-lg)" }}>Ups – da ist etwas schiefgelaufen.</h2>
        <p style={{ margin: "0 0 1rem", color: "var(--muted)", fontSize: "var(--fs-sm)" }}>
          Dein Lernfortschritt ist gespeichert. Lade die App einfach neu.
        </p>
        <button className="hover-pop" onClick={this.handleReload}
          style={{ minHeight: 44, padding: "0.5rem 1.2rem", borderRadius: "var(--r-full)",
            border: "1px solid var(--glass-border)", background: "var(--surface)",
            color: "var(--text)", fontWeight: 700, cursor: "pointer" }}>
          ↺ Neu laden
        </button>
      </GlassCard>
    );
  }
}
