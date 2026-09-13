"use client";
import { usePathname } from "next/navigation";
import { motion, useScroll, useSpring } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";
import { tapSpring } from "./hud/motion";

// Dev serves the Next app at :3000 with real routes (/privacy); the static
// export + root mirror are flat files at the same level, so pages link as
// privacy.html.
const dev = process.env.NODE_ENV === "development";
const PLAY_URL = "https://play.google.com/store/apps/details?id=com.valsync.app";

export default function Nav() {
  const { t } = useI18n();
  const pathname = usePathname();
  const prefix = pathname === "/" ? "" : "/";
  const B = process.env.NEXT_PUBLIC_BASE_PATH;

  // Read progress, drawn as a hairline under the bar — the site's version of
  // the app's thin telemetry meters.
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 240, damping: 40, restDelta: 0.001 });

  const links = [
    { href: `${B}${prefix}#dashboard`, label: t("nav.my_stats") },
    { href: `${B}${prefix}#app`, label: t("nav.app") },
    { href: `${B}${prefix}#matches`, label: "My matches" },
    { href: `${B}${prefix}#updates`, label: t("nav.updates") },
    { href: `${B}${prefix}#pricing`, label: t("nav.pricing") },
    { href: dev ? "/privacy" : "privacy.html", label: t("nav.privacy") },
  ];

  return (
    <header className="topnav">
      <div className="container topnav-inner">
        <a className="logo" href={`${B}${prefix}#top`}>
          <span className="pip" aria-hidden />
          {/* Plain img: the static export runs without image optimization. */}
          <img className="logo-mark" src={`${B}/mr7gmipd-playstore.png`} alt="" />
          <span>VALSYNC</span>
        </a>

        <nav className="nav-right" aria-label="Primary">
          <div className="nav-links">
            {links.map((l) => (
              <a key={l.label} href={l.href}>
                {l.label}
              </a>
            ))}
          </div>
          <div className="nav-actions">
            <LangSwitch />
            <motion.a
              className="btn btn-ghost btn-sm"
              href={PLAY_URL}
              target="_blank"
              rel="noreferrer noopener"
              whileTap={{ scale: 0.96 }}
              transition={tapSpring}
            >
              {t("nav.download")}
            </motion.a>
            <motion.a
              className="btn btn-primary btn-sm nav-cta"
              href={`${B}${prefix}#final`}
              whileTap={{ scale: 0.96 }}
              transition={tapSpring}
            >
              {t("nav.search_cta")}
            </motion.a>
            {/* Narrow bars drop the two long labels above and carry the one
                action that matters on a phone: install it. */}
            <motion.a
              className="btn btn-primary btn-sm nav-cta-sm"
              href={PLAY_URL}
              target="_blank"
              rel="noreferrer noopener"
              whileTap={{ scale: 0.96 }}
              transition={tapSpring}
            >
              {t("nav.get_app")}
            </motion.a>
          </div>
        </nav>
      </div>

      <motion.div className="nav-progress" style={{ scaleX: progress }} aria-hidden />
    </header>
  );
}
