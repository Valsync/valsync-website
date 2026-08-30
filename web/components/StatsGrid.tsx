"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { SOCIAL_STATS } from "@/lib/mock";
import SectionHead from "./hud/SectionHead";
import CountUp from "./CountUp";
import { fadeItem, staggerParent, viewportOnce } from "./hud/motion";

// Every figure here is a zero or a small count, so the tint carries the
// meaning: cyan for the things we don't do, gold for the things we ship.
const TONE = ["var(--cyan)", "var(--cyan)", "var(--gold)", "var(--cyan)"];

export default function StatsGrid() {
  const { t } = useI18n();

  return (
    <section className="section" id="stats">
      <div className="container">
        <SectionHead
          eyebrow={t("sp.eyebrow")}
          title={t("sp.title")}
          note={t("sp.lead")}
          tone="cyan"
        />

        <motion.div
          className="stat-grid"
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {SOCIAL_STATS.map((s, i) => (
            <motion.div className="stat-cell" key={s.label} variants={fadeItem}>
              <div className="stat-value" style={{ color: TONE[i % TONE.length] }}>
                <CountUp to={s.value} decimals={s.decimals ?? 0} prefix={s.prefix} suffix={s.suffix} />
              </div>
              <div className="stat-label">{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
