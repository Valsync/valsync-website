"use client";
import Script from "next/script";
import { useI18n } from "@/lib/i18n";
import CommandLine from "./CommandLine";

export default function FinalCta() {
  const { t } = useI18n();
  return (
    <section className="cta-final" id="final">
      <div className="container">
        <div className="row">
          <div>
            <p className="byline">{t("fcta.eyebrow")}</p>
            <h2 className="h2">{t("fcta.title")}</h2>
            <p className="copy">{t("fcta.lead")}</p>
          </div>
          <div>
            <CommandLine />
            <div className="cmd-hint" style={{ paddingTop: 16 }}>
              <span><kbd>↵</kbd> {t("fcta.cta")}</span>
            </div>
            <div style={{ marginTop: 16, display: "flex", gap: 12, alignItems: "center" }}>
              <a href="https://liberapay.com/AbdullahElTiby/donate">
                <img alt="Donate using Liberapay" src="https://liberapay.com/assets/widgets/donate.svg" />
              </a>
              <Script src="https://liberapay.com/AbdullahElTiby/widgets/button.js" strategy="afterInteractive" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
