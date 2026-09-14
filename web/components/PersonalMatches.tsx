"use client";

import { motion } from "framer-motion";
import { usePersonalStats } from "@/lib/personal-stats";
import Panel from "./hud/Panel";
import SectionHead from "./hud/SectionHead";
import { riseItem, staggerParent, viewportOnce } from "./hud/motion";

export default function PersonalMatches() {
  const { data, isLive } = usePersonalStats();

  // Hide stats completely until player signs in with their Riot account
  if (!isLive || !data || !data.matches || data.matches.length === 0) {
    return null;
  }

  const { matches, profile } = data;

  return (
    <section className="section" id="matches">
      <div className="container">
        <SectionHead
          eyebrow="Match history"
          title="Review your last queue."
          lead="Results, role and rank movement in one personal timeline. No public player lookup required."
          note={`COMPETITIVE · ${profile.name}${profile.tag}`}
          tone="gold"
        />
        <Panel className="match-panel" accent="gold" fill="deep" variants={riseItem}>
          <motion.div
            className="match-table"
            variants={staggerParent(0.06)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
          >
            <div className="match-columns t-micro">
              <span>Result</span>
              <span>Map / agent</span>
              <span>K / D / A</span>
              <span>Rank rating</span>
            </div>
            {matches.map((match, idx) => (
              <motion.article
                className="match-row"
                key={`${match.map}-${match.time}-${idx}`}
                variants={riseItem}
              >
                <div>
                  <b
                    className={
                      match.result === "Victory" ? "result-win" : "result-loss"
                    }
                  >
                    {match.result}
                  </b>
                  <span className="t-mono">
                    {match.score} · {match.time}
                  </span>
                </div>
                <div className="match-agent">
                  <span>
                    <b>{match.map}</b>
                    <small>{match.agent}</small>
                  </span>
                </div>
                <div className="mono match-kda">{match.kda}</div>
                <div
                  className={
                    match.rr
                      ? `match-rr ${match.rr.startsWith("+") ? "result-win" : "result-loss"}`
                      : "match-rr"
                  }
                >
                  {match.rr || "—"} {match.rr ? <span>RR</span> : null}
                </div>
              </motion.article>
            ))}
          </motion.div>
        </Panel>
      </div>
    </section>
  );
}
