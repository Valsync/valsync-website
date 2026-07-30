"use client";
import { useI18n } from "@/lib/i18n";
import { UPDATES } from "@/lib/mock";
import Reveal from "./Reveal";

export default function Updates() {
  const { t } = useI18n();
  return (
    <Reveal className="section reveal" id="updates">
      <div className="container">
        <div className="sec-head">
          <div>
            <p className="eyebrow"><span className="dot" /> {t("recent.eyebrow")}</p>
            <h2 className="h2" style={{ marginTop: 12 }}>{t("recent.title")}</h2>
          </div>
          <p className="meta text-mute">{t("recent.lead")}</p>
        </div>
        <div className="log">
          {UPDATES.map((u) => (
            <div className="log-row" key={u.version}>
              <span className="ver">
                <span className={`tag ${u.tag}`}>{u.tag === "latest" ? t("recent.latest") : t("recent.shipped")}</span>
                {u.version}
              </span>
              <span className="body">{u.body}<span className="date">{u.date}</span></span>
              <span className="meta">{u.date}</span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
