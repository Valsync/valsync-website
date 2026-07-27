"use client";
import { useI18n } from "@/lib/i18n";
import { LEADERBOARD } from "@/lib/mock";
import Reveal from "./Reveal";

export default function LeaderboardSection() {
  const { t } = useI18n();
  return (
    <Reveal className="section reveal" id="leaderboards">
      <div className="container">
        <div className="sec-head">
          <div>
            <p className="eyebrow"><span className="dot" /> {t("lb.eyebrow")}</p>
            <h2 className="h2" style={{ marginTop: 12 }}>{t("lb.title")}</h2>
          </div>
          <p className="meta text-mute">{t("lb.lead")}</p>
        </div>

        <div className="lb" role="table" aria-label="Top ranked players">
          <div className="lb-head" role="row">
            <span role="columnheader">#</span>
            <span role="columnheader">Player</span>
            <span role="columnheader" className="h-tier">Tier</span>
            <span role="columnheader" className="h-region">Region</span>
            <span role="columnheader" className="h-bar">Form</span>
            <span role="columnheader" style={{ textAlign: "right" }}>Win Rate</span>
          </div>
          {LEADERBOARD.map((e) => (
            <div className={`lb-row${e.rank === 1 ? " top1" : ""}`} role="row" key={e.name}>
              <span className="rank">{e.rank.toString().padStart(2, "0")}</span>
              <span className="name">{e.name}<span className="tag">#{e.tag}</span></span>
              <span className="tier">{e.tier}</span>
              <span className="region">{e.region}</span>
              <span className="bar"><span style={{ width: `${e.winRate}%` }} /></span>
              <span className="wr">{e.winRate}<span className="unit">%</span></span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
