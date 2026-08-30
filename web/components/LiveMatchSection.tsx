"use client";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n";
import { ENEMY_TEAM, MATCH_PREDICTION, type Rank } from "@/lib/mock";
import BracketLabel from "./hud/BracketLabel";
import Panel from "./hud/Panel";
import SectionHead from "./hud/SectionHead";
import CountUp from "./CountUp";
import { easeOut, riseItem, slideItem, staggerParent, viewportOnce } from "./hud/motion";

/**
 * Rank tint, keyed the way the app keys it (theme/Color.kt: valRankTierColor).
 * The app matches on the numeric tier rather than the name — a localized rank
 * label would never match an English keyword — but the mock data here is
 * English-only display copy, so a name map is the honest equivalent.
 */
const RANK_COLOR: Record<Rank, string> = {
  Radiant: "var(--rank-radiant)",
  "Immortal 3": "var(--rank-immortal)",
  "Immortal 2": "var(--rank-immortal)",
  "Immortal 1": "var(--rank-immortal)",
  "Ascendant 3": "var(--rank-ascendant)",
  "Ascendant 2": "var(--rank-ascendant)",
  "Ascendant 1": "var(--rank-ascendant)",
  "Diamond 3": "var(--rank-diamond)",
};

const R = 52;
const CIRC = 2 * Math.PI * R;

export default function LiveMatchSection() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const dialRef = useRef<HTMLDivElement>(null);
  const dialInView = useInView(dialRef, { once: true, amount: 0.5 });

  const pct = MATCH_PREDICTION.winChance / 100;

  return (
    <section className="section" id="live-match">
      <div className="container">
        <SectionHead
          eyebrow={t("lmp.eyebrow")}
          title={t("lmp.title")}
          lead={t("lmp.lead")}
          note="Sample lobby — the shape of the real read-out."
        />

        <motion.div
          className="lm-wrap"
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <Panel className="lm-roster" accent="red" grid scanlines variants={riseItem}>
            <div className="lm-head">
              <BracketLabel tone="red">Enemy team</BracketLabel>
              <span className="t-micro">
                {t("lmp.avg_acs")} {MATCH_PREDICTION.avgAcs} · {t("lmp.avg_hs")}{" "}
                {MATCH_PREDICTION.avgHs}%
              </span>
            </div>

            {ENEMY_TEAM.map((p, i) => (
              <motion.div
                className="lm-row"
                key={p.agent}
                data-threat={p.threat}
                variants={slideItem}
                custom={i}
              >
                <span className="lm-agent" aria-hidden>
                  {p.agent.charAt(0)}
                </span>
                <span className="t-title">{p.agent}</span>
                <span className="lm-rank" style={{ color: RANK_COLOR[p.rank] }}>
                  {p.rank}
                </span>
                <span className="lm-acs" style={{ color: p.threat ? "var(--red)" : "var(--fg)" }}>
                  {p.acs}
                </span>
              </motion.div>
            ))}
          </Panel>

          <Panel className="lm-dial" accent="cyan" fill="deep" brackets variants={riseItem}>
            <div className="lm-gauge" ref={dialRef}>
              <svg viewBox="0 0 128 128" role="img" aria-label={`${t("lmp.win_label")}: ${MATCH_PREDICTION.winChance}%`}>
                <circle
                  cx="64"
                  cy="64"
                  r={R}
                  fill="none"
                  stroke="rgb(255 255 255 / 0.07)"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r={R}
                  fill="none"
                  stroke="var(--cyan)"
                  strokeWidth="8"
                  strokeLinecap="butt"
                  strokeDasharray={CIRC}
                  transform="rotate(-90 64 64)"
                  initial={{ strokeDashoffset: CIRC }}
                  animate={
                    dialInView || reduce
                      ? { strokeDashoffset: CIRC * (1 - pct) }
                      : undefined
                  }
                  transition={{ duration: 1.3, ease: easeOut }}
                />
              </svg>
              <div className="lm-gauge-value">
                <div className="t-num c-cyan" style={{ fontSize: "3rem" }}>
                  <CountUp to={MATCH_PREDICTION.winChance} suffix="%" />
                </div>
                <div className="t-micro" style={{ marginTop: 6 }}>
                  {t("lmp.win_label")}
                </div>
              </div>
            </div>

            <dl className="lm-facts">
              <div className="lm-fact">
                <dt className="t-micro">{t("lmp.mvp")}</dt>
                <dd className="t-title" style={{ margin: 0 }}>
                  {MATCH_PREDICTION.mvp}
                </dd>
              </div>
              <div className="lm-fact">
                <dt className="t-micro">{t("lmp.threat")}</dt>
                <dd
                  className="t-title"
                  style={{ margin: 0, color: RANK_COLOR[MATCH_PREDICTION.highestThreat as Rank] }}
                >
                  {MATCH_PREDICTION.highestThreat}
                </dd>
              </div>
              <div className="lm-fact">
                <dt className="t-micro">{t("lmp.avg_acs")}</dt>
                <dd className="t-title mono" style={{ margin: 0 }}>
                  {MATCH_PREDICTION.avgAcs}
                </dd>
              </div>
            </dl>
          </Panel>
        </motion.div>
      </div>
    </section>
  );
}
