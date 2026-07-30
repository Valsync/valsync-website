"use client";
import { useI18n } from "@/lib/i18n";
import { ENEMY_TEAM, MATCH_PREDICTION } from "@/lib/mock";
import Reveal from "./Reveal";

export default function LiveMatchSection() {
  const { t } = useI18n();
  return (
    <Reveal className="section reveal" id="live-match">
      <div className="container">
        <div className="sec-head">
          <div>
            <p className="eyebrow"><span className="dot" /> {t("lmp.eyebrow")}</p>
            <h2 className="h2" style={{ marginTop: 12 }}>{t("lmp.title")}</h2>
          </div>
          <p className="meta text-mute">{t("lmp.lead")}</p>
        </div>

        <div className="lm-grid">
          <div className="lm-team" role="table" aria-label="Enemy team">
            <div className="lm-team-head">
              <span>Enemy · 5</span>
              <span className="enemy">Threat · {ENEMY_TEAM.filter((p) => p.threat).length}</span>
            </div>
            {ENEMY_TEAM.map((p, i) => (
              <div className={`lm-player${p.threat ? " is-threat" : ""}`} key={`${p.agent}-${i}`}>
                <span className="agent" aria-hidden>{p.agent.slice(0, 2).toUpperCase()}</span>
                <span className="name">{p.agent}</span>
                <span className="rank">{p.rank}</span>
                <span className="acs">{p.acs}</span>
                <span className={`threat${p.threat ? "" : " is-empty"}`}>{p.threat ? "Threat" : "—"}</span>
              </div>
            ))}
          </div>

          <div className="lm-pred">
            <div className="label">{t("lmp.win_label")}</div>
            <div className="win">{MATCH_PREDICTION.winChance}<span className="pct">%</span></div>
            <div className="stats">
              <div>
                <div className="k">{t("lmp.mvp")}</div>
                <div className="v" style={{ color: "var(--amber)" }}>{MATCH_PREDICTION.mvp}</div>
              </div>
              <div>
                <div className="k">{t("lmp.avg_acs")}</div>
                <div className="v">{MATCH_PREDICTION.avgAcs}</div>
              </div>
              <div>
                <div className="k">{t("lmp.avg_hs")}</div>
                <div className="v">{MATCH_PREDICTION.avgHs}<span style={{ fontSize: "0.6em", color: "var(--faint)" }}>%</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
