"use client";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";

// Dev serves the Next app at :3000 with real routes (/privacy); the static
// export + root mirror are flat files at the same level, so pages link as
// privacy.html.
const dev = process.env.NODE_ENV === "development";

export default function Nav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const prefix = pathname === "/" ? "" : "/";
  const B = process.env.NEXT_PUBLIC_BASE_PATH;

  return (
    <header className="topnav">
      <div className="container topnav-inner">
        <a className="logo" href={`${B}${prefix}#top`}>
          {/* ponytail: plain img, static export has no image optimization */}
          <img className="logo-mark" src={`${B}/mr7gmipd-playstore.png`} alt="VALSYNC" />
          <span>VALSYNC</span>
        </a>

        <nav className="nav-right" aria-label="Primary">
          <div className="nav-links">
            <a href={`${B}${prefix}#search`}>{t("nav.search")}</a>
            <a href={`${B}${prefix}#leaderboards`}>{t("nav.leaderboards")}</a>
            <a href={`${B}${prefix}#live-match`}>{t("nav.livematch")}</a>
            <a href={`${B}${prefix}#updates`}>{t("nav.updates")}</a>
            <a href={`${B}${prefix}#pricing`}>{t("nav.pricing")}</a>
            <a href={dev ? "/privacy" : "privacy.html"}>{t("nav.privacy")}</a>
            <a href={dev ? "/terms" : "terms.html"}>{t("nav.terms")}</a>
          </div>
          <div className="nav-actions">
            <LangSwitch />
            <a
              className="btn btn-ghost"
              href="https://play.google.com/store/apps/details?id=com.valsync.app"
              target="_blank"
              rel="noreferrer noopener"
            >
              {t("nav.download")}
            </a>
            <a className="btn btn-primary" href={`${B}${prefix}#final`}>{t("nav.search_cta")}</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
