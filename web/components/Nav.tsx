"use client";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";

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
            <a href={`${B}/privacy`}>{t("nav.privacy")}</a>
            <a href={`${B}/terms`}>{t("nav.terms")}</a>
          </div>
          <div className="nav-actions">
            <LangSwitch />
            <a className="btn btn-primary" href={`${B}${prefix}#final`}>{t("nav.search_cta")}</a>
          </div>
        </nav>
      </div>
    </header>
  );
}
