"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import SectionHead from "./hud/SectionHead";

const B = process.env.NEXT_PUBLIC_BASE_PATH;
const SCREENS = ["home", "career", "mastery", "loadout", "party", "rewards"] as const;

export default function Screens() {
  const { t } = useI18n();
  const [active, setActive] = useState<(typeof SCREENS)[number]>("home");

  return (
    <section className="section" id="app">
      <div className="container">
        <SectionHead eyebrow={t("appGallery.eyebrow")} title={t("appGallery.title")} lead={t("appGallery.lead")} note={t("appGallery.note")} tone="cyan" />
        <div className="app-gallery">
          <div className="app-gallery-copy">
            <div className="app-gallery-options" role="group" aria-label={t("appGallery.choose")}>
              {SCREENS.map((screen, index) => (
                <button key={screen} type="button" className="app-gallery-option" aria-pressed={active === screen} aria-controls="app-gallery-preview" onClick={() => setActive(screen)}>
                  <span className="t-micro">{String(index + 1).padStart(2, "0")}</span>
                  <span>{t(`appGallery.${screen}.name`)}</span>
                </button>
              ))}
            </div>
            <div className="app-gallery-detail" aria-live="polite">
              <span className="t-micro c-cyan">{t("appGallery.detailLabel")}</span>
              <h3>{t(`appGallery.${active}.heading`)}</h3>
              <p className="t-lead">{t(`appGallery.${active}.detail`)}</p>
            </div>
            <div className="app-gallery-thumbnails">
              {(["career", "mastery", "loadout"] as const).map((screen) => (
                <button key={screen} type="button" onClick={() => setActive(screen)} aria-label={`${t("appGallery.view")} ${t(`appGallery.${screen}.name`)}`} aria-pressed={active === screen} aria-controls="app-gallery-preview">
                  <img src={`${B}/img/app-${screen}.webp`} alt="" width="540" height="1200" loading="lazy" decoding="async" />
                  <span className="t-micro">{t(`appGallery.${screen}.name`)}</span>
                </button>
              ))}
            </div>
            <p className="app-gallery-note t-mono">{t("appGallery.disclaimer")}</p>
          </div>
          <figure className="app-gallery-stage" id="app-gallery-preview">
            <div className="app-gallery-device">
              <img key={active} src={`${B}/img/app-${active}.webp`} alt={t(`appGallery.${active}.alt`)} width="540" height="1200" loading="lazy" decoding="async" />
            </div>
            <figcaption className="screen-caption t-micro">{t(`appGallery.${active}.name`)} · {t("appGallery.capture")}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
