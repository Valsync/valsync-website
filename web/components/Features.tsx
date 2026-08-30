"use client";
import { motion } from "framer-motion";
import { BookOpen, Map, Radar, Swords, TrendingUp, Trophy } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Panel from "./hud/Panel";
import SectionHead from "./hud/SectionHead";
import { riseItem, staggerParent, viewportOnce } from "./hud/motion";

// Six modules, six accents on a three-signal rotation (cyan · gold · red) —
// the same accent set the app assigns to its telemetry surfaces.
const CARDS = [
  { key: "c1", Icon: Radar, color: "var(--cyan)", accent: "cyan" },
  // Not shipped in the app yet — the card carries a status chip.
  { key: "c2", Icon: Trophy, color: "var(--gold)", accent: "gold", soon: true },
  { key: "c3", Icon: TrendingUp, color: "var(--red)", accent: "red" },
  { key: "c4", Icon: Swords, color: "var(--cyan)", accent: "cyan" },
  { key: "c5", Icon: Map, color: "var(--gold)", accent: "gold" },
  { key: "c6", Icon: BookOpen, color: "var(--red)", accent: "red" },
] as const;

export default function Features() {
  const { t } = useI18n();

  return (
    <section className="section" id="features">
      <div className="container">
        <SectionHead
          eyebrow="Modules"
          title={t("fgrid.title")}
          lead={t("fgrid.lead")}
          note="Six surfaces. Each one keeps a narrow job."
        />

        <motion.div
          className="fgrid"
          variants={staggerParent(0.07)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {CARDS.map(({ key, Icon, color, accent, ...card }, i) => (
            <Panel
              key={key}
              className="fcard"
              accent={accent}
              variants={riseItem}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 260, damping: 24 }}
            >
              <span className="fcard-index mono">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span
                className="fcard-icon"
                style={{ ["--fcard-color" as string]: color }}
                aria-hidden
              >
                <Icon size={19} strokeWidth={1.9} />
              </span>
              <h3 className="t-headline">{t(`fgrid.${key}.title`)}</h3>
              <p className="t-body" style={{ marginTop: 10 }}>
                {t(`fgrid.${key}.desc`)}
              </p>
              <div className="fcard-tags">
                {"soon" in card && (
                  <span className="chip chip-static lb-soon-chip">{t("lb.badge")}</span>
                )}
                {t(`fgrid.${key}.tags`)
                  .split("|")
                  .map((tag) => (
                    <span className="chip chip-static" key={tag}>
                      {tag}
                    </span>
                  ))}
              </div>
            </Panel>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
