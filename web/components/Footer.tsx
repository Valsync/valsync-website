"use client";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import BracketLabel from "./hud/BracketLabel";

const dev = process.env.NODE_ENV === "development";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.valsync.app";

export default function Footer() {
  const { t } = useI18n();
  const pathname = usePathname();
  const prefix = pathname === "/" ? "" : "/";
  const B = process.env.NEXT_PUBLIC_BASE_PATH;

  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <span className="logo">
              <span className="pip" aria-hidden />
              <img className="logo-mark" src={`${B}/mr7gmipd-playstore.png`} alt="" />
              VALSYNC
            </span>
            <p className="t-body" style={{ marginTop: 14, maxWidth: "34ch" }}>
              {t("footer.left")}
            </p>
            <div style={{ marginTop: 18 }}>
              <BracketLabel tone="cyan">{t("footer.right")}</BracketLabel>
            </div>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <a href={`${B}${prefix}#features`}>{t("nav.features")}</a>
            <a href={`${B}${prefix}#app`}>{t("nav.app")}</a>
            <a href={`${B}${prefix}#leaderboards`}>{t("nav.leaderboards")}</a>
            <a href={`${B}${prefix}#updates`}>{t("nav.updates")}</a>
            <a href={`${B}${prefix}#pricing`}>{t("nav.pricing")}</a>
          </div>

          <div className="footer-col">
            <h4>Elsewhere</h4>
            <a href={PLAY_URL} target="_blank" rel="noreferrer noopener">
              Google Play
            </a>
            <a href="https://discord.gg/5WHvNtskew" target="_blank" rel="noreferrer noopener">
              Discord
            </a>
            <a href="https://x.com/valsyncgg" target="_blank" rel="noreferrer noopener">
              X / Twitter
            </a>
            <a href={dev ? "/privacy" : "privacy.html"}>{t("nav.privacy")}</a>
            <a href={dev ? "/terms" : "terms.html"}>{t("nav.terms")}</a>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="t-mono">
            © {new Date().getFullYear()} VALSYNC · Not affiliated with Riot Games, Inc.
          </p>
          <p className="t-mono">Valorant is a trademark of Riot Games, Inc.</p>
        </div>
      </div>
    </footer>
  );
}
