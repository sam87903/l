import { memo, useMemo } from "react";
import { Check } from "lucide-react";
import Disclosure from "../ui/Disclosure.jsx";
import { CHAINS } from "../../data/chains.js";
import { SEMESTERS } from "../../data/semesters/index.js";
import { useProgress } from "../../context/ProgressContext.jsx";
import { baseModId } from "../../utils/insights.js";
import { cx, kb } from "../../utils/misc.js";
import styles from "./semester.module.css";

const MODULES = new Map(
  SEMESTERS.flatMap((s) => s.modules.map((m) => [m.id, { ...m, semNr: s.nr }]))
);

const STATUS = {
  sicher: { icon: "✅", label: "sicher" },
  begonnen: { icon: "🟠", label: "begonnen" },
  offen: { icon: "○", label: "offen" },
};

/**
 * Chain-Learning: empfohlene Lernreihenfolgen über Module hinweg, mit
 * Fortschrittsstatus je Schritt (sicher / begonnen / offen). Der ganze
 * Bereich ist einklappbar (standardmäßig zu); jede Kette lässt sich
 * abhaken, wenn man sie durchgearbeitet hat.
 */
const LearningChains = memo(function LearningChains({ onOpenModule }) {
  const { quizBest, fcKnown, srs, chainsDone, toggleChainDone } = useProgress();

  const chains = useMemo(() => {
    // Quiz-Quoten (Basis + Erweitert) je Modul bündeln
    const ratios = new Map();
    for (const [key, best] of Object.entries(quizBest)) {
      if (!best?.t) continue;
      const mod = baseModId(key);
      const cur = ratios.get(mod) ?? { c: 0, t: 0 };
      cur.c += best.c;
      cur.t += best.t;
      ratios.set(mod, cur);
    }
    const statusFor = (modId) => {
      const module = MODULES.get(modId);
      const ratio = ratios.get(modId);
      const known = (fcKnown[modId] ?? []).length;
      const cardCount = module?.cards?.length ?? 0;
      if ((ratio && ratio.c / ratio.t >= 0.8) || (cardCount > 0 && known / cardCount >= 0.6)) return "sicher";
      if (ratio || known > 0 || Object.keys(srs[modId] ?? {}).length > 0) return "begonnen";
      return "offen";
    };
    return CHAINS.map((chain) => ({
      ...chain,
      steps: chain.steps
        .map((id) => MODULES.get(id))
        .filter(Boolean)
        .map((module) => ({ module, status: statusFor(module.id) })),
    }));
  }, [quizBest, fcKnown, srs]);

  const doneCount = CHAINS.filter((c) => chainsDone[c.id]).length;

  return (
    <Disclosure
      icon="🔗"
      title="Lernketten · empfohlene Reihenfolge"
      meta={`${doneCount}/${CHAINS.length} erledigt`}
    >
      <p className={styles.chainsLead}>
        Diese Module bauen aufeinander auf – wer der Kette folgt, hat für jeden
        nächsten Schritt das Vorwissen schon im Kopf. Hake eine Kette ab, wenn du
        sie durch hast.
      </p>
      {chains.map((chain) => {
        const done = !!chainsDone[chain.id];
        return (
          <div key={chain.id} className={cx(styles.chain, done && styles.chainDone)}>
            <div className={styles.chainHead}>
              <span aria-hidden="true">{chain.icon}</span>
              <strong>{chain.name}</strong>
              <span className={styles.chainDesc}>{chain.desc}</span>
              <button
                className={cx(styles.chainCheck, done && styles.chainCheckOn, "hover-pop")}
                onClick={() => toggleChainDone(chain.id)}
                {...kb(() => toggleChainDone(chain.id))}
                role="checkbox"
                aria-checked={done}
                aria-label={`Kette „${chain.name}" ${done ? "als offen markieren" : "als erledigt abhaken"}`}
              >
                {done && <Check size={13} aria-hidden="true" />}
              </button>
            </div>
            <div className={styles.chainSteps}>
              {chain.steps.map(({ module, status }, i) => (
                <div key={module.id} className={styles.chainStepWrap}>
                  {i > 0 && <span className={styles.chainConnector} aria-hidden="true" />}
                  <button
                    className={cx(styles.chainStep, styles[`chainStep_${status}`], "hover-pop")}
                    onClick={() => onOpenModule(module)}
                    {...kb(() => onOpenModule(module))}
                    title={`${module.name} (Semester ${module.semNr}) – ${STATUS[status].label}`}
                  >
                    <span aria-hidden="true">{STATUS[status].icon}</span>
                    <span className={styles.chainStepCode}>{module.code}</span>
                    <span className={styles.chainStepStatus}>{STATUS[status].label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </Disclosure>
  );
});

export default LearningChains;
