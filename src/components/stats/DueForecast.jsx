import { memo, useMemo } from "react";
import { CalendarClock } from "lucide-react";
import GlassCard from "../ui/GlassCard.jsx";
import { useProgress } from "../../context/ProgressContext.jsx";
import {
  cardMasteryDate,
  dueForecast,
  fmtForecastDate,
  fmtForecastWeekday,
  mistakeClearDate,
} from "../../utils/forecast.js";
import { ACCENT } from "../../constants/theme.js";
import { cx } from "../../utils/misc.js";
import styles from "./forecast.module.css";

/** „in 4 Tagen" statt eines nackten Datums, wo es näher liegt. */
const relDay = (offset) => (offset === 0 ? "heute" : offset === 1 ? "morgen" : `in ${offset} Tagen`);

/** Deutsche Dezimalschreibweise – toFixed liefert einen Punkt. */
const fmtAvg = (n) =>
  new Intl.NumberFormat("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n);

/**
 * Lernlast-Vorschau: Was kommt in den nächsten 14 Tagen auf dich zu?
 *
 * Gegenstück zum „Lern-Rückblick", der nur zurückschaut. Nützlich vor allem
 * zur Reiseplanung – man sieht vorab, ob morgen 5 oder 50 Wiederholungen
 * anstehen. Rechnet ausschließlich aus vorhandenen Daten.
 */
const DueForecast = memo(function DueForecast() {
  const { srs, wrongPool } = useProgress();

  const forecast = useMemo(() => dueForecast({ srs, wrongPool }), [srs, wrongPool]);
  const mistakes = useMemo(() => mistakeClearDate(wrongPool), [wrongPool]);
  const cards = useMemo(() => cardMasteryDate(srs), [srs]);

  const maxScale = Math.max(4, forecast.peak?.total ?? 0);
  const empty = forecast.total === 0 && forecast.beyond === 0;

  return (
    <GlassCard tint={ACCENT.violet} style={{ "--c": ACCENT.violet, padding: "var(--s-4)", marginBottom: "var(--s-4)" }}>
      <div className={styles.head}>
        <span className={styles.kicker}>
          <CalendarClock size={14} aria-hidden="true" /> Was auf dich zukommt
        </span>
        <span className={styles.range}>nächste 14 Tage</span>
      </div>

      {empty ? (
        <p className={styles.lead}>
          Noch nichts eingeplant. Sobald du Lernkarten bewertest oder Quizfragen falsch
          beantwortest, planen die Leitner-Systeme die Wiederholungen – und du siehst hier
          im Voraus, wann sie anstehen.
        </p>
      ) : (
        <>
          <p className={styles.lead}>
            <strong>{forecast.total}</strong> {forecast.total === 1 ? "Wiederholung" : "Wiederholungen"} in
            den nächsten 14 Tagen · Ø <strong>{fmtAvg(forecast.perDay)}</strong> pro Tag
            {forecast.peak && forecast.peak.total > 0 && (
              <> · am meisten <strong>{relDay(forecast.peak.offset)}</strong> ({forecast.peak.total})</>
            )}
          </p>

          <div className={styles.chart} role="img"
            aria-label={`Fällige Wiederholungen der nächsten 14 Tage, insgesamt ${forecast.total}`}>
            {forecast.days.map((d) => {
              const h = Math.round((d.total / maxScale) * 100);
              return (
                <div key={d.iso} className={styles.day}>
                  <span className={styles.count}>{d.total > 0 ? d.total : ""}</span>
                  <div className={styles.track}
                    title={`${fmtForecastDate(d.iso)}: ${d.cards} Karten, ${d.questions} Fragen`}>
                    {/* Zwei gestapelte Segmente: Karten unten, Fragen oben. */}
                    <div className={styles.stack} style={{ height: `${h}%` }}>
                      {d.questions > 0 && (
                        <div className={styles.segQuestions} style={{ flex: d.questions }} />
                      )}
                      {d.cards > 0 && <div className={styles.segCards} style={{ flex: d.cards }} />}
                    </div>
                  </div>
                  {/* Bei 14 Spalten auf 390 px passt nur das Kürzel – „heute"
                      würde abgeschnitten. Der heutige Tag wird eingefärbt. */}
                  <span className={cx(styles.wd, d.offset === 0 && styles.wdToday)}>
                    {fmtForecastWeekday(d.iso)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={cx(styles.dot, styles.dotCards)} aria-hidden="true" />
              {forecast.cards} Lernkarten
            </span>
            <span className={styles.legendItem}>
              <span className={cx(styles.dot, styles.dotQuestions)} aria-hidden="true" />
              {forecast.questions} Quizfragen
            </span>
            {forecast.beyond > 0 && (
              <span className={styles.legendItem}>+{forecast.beyond} später</span>
            )}
          </div>
        </>
      )}

      {(mistakes || cards) && (
        <div className={styles.projection}>
          {mistakes && (
            <p className={styles.projRow}>
              🔁 Deine <strong>{mistakes.count}</strong> {mistakes.count === 1 ? "Fehlerfrage" : "Fehlerfragen"} wären
              {mistakes.days === 0 ? " heute" : ` am ${fmtForecastDate(mistakes.iso)}`} durch.
            </p>
          )}
          {cards && (
            <p className={styles.projRow}>
              {/* Das deutsche Kurzdatum endet selbst auf einen Punkt – ein
                  weiterer Satzpunkt ergäbe „18.09..". */}
              🃏 Deine <strong>{cards.started}</strong> begonnenen Karten erreichen die oberste Stufe
              {cards.days === 0 ? " – geschafft." : ` am ${fmtForecastDate(cards.iso)}`}
              {cards.untouched > 0 && <> {cards.untouched} Karten sind noch unangetastet.</>}
            </p>
          )}
          {/* Ehrlich einordnen: Das ist eine Untergrenze, keine Vorhersage. */}
          <p className={styles.projNote}>
            Frühestmögliche Termine – gerechnet mit lückenloser Wiederholung ohne Fehler.
            Jede falsche Antwort setzt den jeweiligen Eintrag zurück.
          </p>
        </div>
      )}
    </GlassCard>
  );
});

export default DueForecast;
