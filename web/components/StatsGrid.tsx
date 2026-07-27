"use client";
import { useI18n } from "@/lib/i18n";
import { SOCIAL_STATS } from "@/lib/mock";
import Reveal from "./Reveal";
import CountUp from "./CountUp";

const TONE: ("crimson" | "amber" | "green" | "sky" | undefined)[] = ["amber", "green", "sky", "crimson", "green"];

export default function StatsGrid() {
  const { t } = useI18n();
  return (
    <Reveal className="section reveal" id="stats">
      <div className="container">
        <div className="sec-head">
          <div>
            <p className="eyebrow"><span className="dot" /> {t("sp.eyebrow")}</p>
            <h2 className="h2" style={{ marginTop: 12 }}>{t("sp.title")}</h2>
          </div>
          <p className="meta text-mute">{t("sp.lead")}</p>
        </div>
        <div className="stats-grid">
          {SOCIAL_STATS.map((s, i) => (
            <div className="stat-cell" key={i}>
              <div className="k">{s.label}</div>
              <div className={`v ${TONE[i] ?? ""}`}>
                <CountUp to={s.value} decimals={s.decimals ?? 0} suffix={s.suffix} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
