"use client";
import { useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { WEB_APP_URL } from "@/lib/companion";
import { useI18n } from "@/lib/i18n";
import BracketLabel from "./hud/BracketLabel";
import { easeOut, riseItem, staggerParent, tapSpring } from "./hud/motion";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.valsync.app";
const B = process.env.NEXT_PUBLIC_BASE_PATH;

const ROTATOR_KEYS = ["hero.word1", "hero.word2", "hero.word3", "hero.word4"];

export default function Hero() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  const [word, setWord] = useState(0);

  // Parallax on the way out — the copy drifts up a little slower than the
  // device, which is what sells the depth without a scroll hijack.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const deviceY = useTransform(scrollYProgress, [0, 1], [0, -130]);
  const fade = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setWord((w) => (w + 1) % ROTATOR_KEYS.length), 2400);
    return () => clearInterval(id);
  }, [reduce]);


  return (
    <section className="hero" id="top" ref={ref}>
      <div className="hero-glow" aria-hidden />
      {!reduce && (
        <motion.div
          className="hero-scan"
          aria-hidden
          initial={{ top: "12%", opacity: 0 }}
          animate={{ top: ["12%", "88%"], opacity: [0, 0.9, 0] }}
          transition={{ duration: 5.2, repeat: Infinity, ease: "linear" }}
        />
      )}

      <div className="container hero-inner">
        <motion.div
          style={reduce ? undefined : { y: copyY, opacity: fade }}
          variants={staggerParent(0.09, 0.05)}
          initial="hidden"
          animate="show"
        >
          <motion.div className="hero-eyebrow" variants={riseItem}>
            <span className="pip" aria-hidden />
            <BracketLabel tone="red">{t("hud.label")}</BracketLabel>
          </motion.div>

          <motion.h1 className="t-hero hero-title" variants={riseItem}>
            Your Valorant
            <span>decoded.</span>
          </motion.h1>

          <motion.div className="hero-rotator" variants={riseItem} aria-hidden>
            <span className="hero-rotator-caret">&gt;</span>
            <span className="hero-rotator-track">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={word}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.45, ease: easeOut }}
                >
                  {t(ROTATOR_KEYS[word])}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.div>

          <a className="btn btn-primary" href={WEB_APP_URL}>{t("companion.open")}</a>

          <motion.ul className="hero-sub" variants={riseItem}>
            <li>Your rank, form and progress.</li>
            <li>Your matches, without the noise.</li>
            <li>Your agent pool and tendencies.</li>
            <li>Your next reason to queue.</li>
          </motion.ul>

          <motion.div className="hero-cta" variants={riseItem}>
            <motion.a
              className="btn btn-primary"
              href="#app"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={tapSpring}
            >
              {t("appGallery.explore")}
            </motion.a>
            <motion.a
              className="btn btn-ghost"
              href={PLAY_URL}
              target="_blank"
              rel="noreferrer noopener"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={tapSpring}
            >
              {t("nav.download")}
            </motion.a>
          </motion.div>

          {/* The app puts its posture on screen; so does the landing page. */}
          <motion.dl className="hero-rail" variants={riseItem}>
            <div>
              <dt>{t("hud.noise")}</dt>
              <dd className="c-red">{t("hud.noise_val")}</dd>
            </div>
            <div>
              <dt>Game data</dt>
              <dd className="c-cyan">Riot services</dd>
            </div>
            <div>
              <dt>{t("hud.sync")}</dt>
              <dd>{t("hud.sync_val")}</dd>
            </div>
          </motion.dl>
        </motion.div>

        <motion.div
          className="hero-device"
          style={reduce ? undefined : { y: deviceY }}
          initial={{ opacity: 0, y: 44, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, ease: easeOut, delay: 0.15 }}
        >
          <span className="hero-device-notch" aria-hidden />
          <div className="hero-device-screen">
            <img src={`${B}/img/app-home.webp`} alt={t("appGallery.home.alt")} width="540" height="1200" fetchPriority="high" />
          </div>

          <motion.div
            className="hero-tag"
            style={{ top: 58, left: -72 }}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7, duration: 0.5, ease: easeOut }}
          >
            <span className="pip" style={{ ["--pip-color" as string]: "var(--cyan)" }} aria-hidden />
            <span className="c-cyan">{t("appGallery.heroTag")}</span>
          </motion.div>

          <motion.div
            className="hero-tag"
            style={{ bottom: 110, right: -78 }}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.85, duration: 0.5, ease: easeOut }}
          >
            <span className="fg-faint">{t("hud.phone_label")}</span>
          </motion.div>
        </motion.div>
      </div>

      <div className="hero-scroll" aria-hidden>
        <span className="t-micro">Scroll</span>
        <span className="hero-scroll-track">
          <i />
        </span>
      </div>
    </section>
  );
}
