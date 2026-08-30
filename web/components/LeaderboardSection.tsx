"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { LEADERBOARD, REGIONS } from "@/lib/mock";
import Panel from "./hud/Panel";
import SectionHead from "./hud/SectionHead";
import { easeOut, riseItem, staggerParent, viewportOnce } from "./hud/motion";

const SCOPES = ["global", ...REGIONS] as const;

export default function LeaderboardSection() {
  const { t } = useI18n();
  const [scope, setScope] = useState<string>("global");

  // The mock ladder is a global snapshot; a region filter narrows it rather
  // than inventing per-region rows we don't have.
  const rows =
    scope === "global" ? LEADERBOARD : LEADERBOARD.filter((r) => r.region === scope);

  return (
    <section className="section" id="leaderboards">
      <div className="container">
        <SectionHead
          eyebrow={t("lb.eyebrow")}
          title={t("lb.title")}
          lead={t("lb.lead")}
          note={t("lb.sample")}
          tone="gold"
        />

        <motion.div
          variants={staggerParent(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.div className="lb-soon" variants={riseItem}>
            <span className="chip chip-static lb-soon-chip">{t("lb.badge")}</span>
          </motion.div>

          <motion.div className="lb-scopes" variants={riseItem}>
            {SCOPES.map((s) => (
              <button
                key={s}
                className="chip"
                data-active={scope === s}
                onClick={() => setScope(s)}
              >
                {s === "global" ? t("lb.global") : s}
              </button>
            ))}
          </motion.div>

          <Panel accent="gold" className="lb-panel lb-panel-preview" variants={riseItem}>
            <table className="lb-table">
              <caption className="lb-caption t-mono">{t("lb.sample")}</caption>
              <thead>
                <tr>
                  <th scope="col">#</th>
                  <th scope="col">Player</th>
                  <th scope="col" className="lb-hide-sm">
                    {t("lb.region")}
                  </th>
                  <th scope="col">Tier</th>
                  <th scope="col" style={{ minWidth: 150 }}>
                    Win rate
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <motion.tr
                    key={`${r.name}-${r.tag}`}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4, ease: easeOut }}
                  >
                    <td className="lb-pos">{String(r.rank).padStart(2, "0")}</td>
                    <td>
                      <span className="lb-name">{r.name}</span>{" "}
                      <span className="lb-tag">#{r.tag}</span>
                    </td>
                    <td className="lb-hide-sm">
                      <span className="t-mono">{r.region}</span>
                    </td>
                    <td>
                      <span
                        className="lm-rank"
                        style={{ color: "var(--rank-radiant)" }}
                      >
                        {r.tier}
                      </span>
                    </td>
                    <td>
                      <div className="lb-winrate">
                        <span className="mono" style={{ fontSize: "0.8125rem" }}>
                          {r.winRate}%
                        </span>
                        <span className="lb-bar">
                          <motion.i
                            initial={{ width: 0 }}
                            whileInView={{ width: `${r.winRate}%` }}
                            viewport={{ once: true }}
                            transition={{
                              delay: 0.15 + i * 0.06,
                              duration: 0.9,
                              ease: easeOut,
                            }}
                          />
                        </span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="lb-empty">
                      <span className="t-mono">◇ No entries for {scope}</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Panel>

          <motion.div variants={riseItem} style={{ marginTop: 22 }}>
            {/* No destination yet: the ladder view does not exist in the app,
                so this reads as a status marker rather than a link. */}
            <span className="btn btn-ghost is-disabled" aria-disabled="true">
              <Clock size={14} strokeWidth={2} />
              {t("lb.view")}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
