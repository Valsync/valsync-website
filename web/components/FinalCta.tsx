"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import Panel from "./hud/Panel";
import BracketLabel from "./hud/BracketLabel";
import CommandLine from "./CommandLine";
import { riseItem, staggerParent, tapSpring, viewportOnce } from "./hud/motion";

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.valsync.app";

export default function FinalCta() {
  const { t } = useI18n();

  return (
    <section className="section" id="final">
      <div className="container">
        <Panel className="fcta" accent="red" fill="deep" grid scanlines brackets>
          <div className="fcta-glow" aria-hidden />

          <motion.div
            variants={staggerParent(0.09)}
            initial="hidden"
            whileInView="show"
            viewport={viewportOnce}
            style={{ position: "relative" }}
          >
            <motion.div variants={riseItem}>
              <BracketLabel tone="red">{t("fcta.eyebrow")}</BracketLabel>
            </motion.div>

            <motion.h2 className="t-display-lg" variants={riseItem} style={{ marginTop: 18 }}>
              {t("fcta.title")}
            </motion.h2>

            <motion.p className="t-lead" variants={riseItem}>
              {t("fcta.lead")}
            </motion.p>

            <motion.div variants={riseItem} style={{ marginTop: 34 }}>
              <div className="cmd-shell">
                <CommandLine />
              </div>
              <p className="cmd-hint" style={{ marginTop: 14 }}>
                <kbd>↵</kbd> {t("fcta.cta")}
              </p>
            </motion.div>

            <motion.div className="fcta-actions" variants={riseItem}>
              <motion.a
                className="btn btn-primary"
                href={PLAY_URL}
                target="_blank"
                rel="noreferrer noopener"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={tapSpring}
              >
                {t("fcta.download")}
              </motion.a>
              <motion.a
                className="btn btn-cyan"
                href="https://liberapay.com/AbdullahElTiby/donate"
                target="_blank"
                rel="noreferrer noopener"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                transition={tapSpring}
              >
                Support development
              </motion.a>
            </motion.div>
          </motion.div>
        </Panel>
      </div>
    </section>
  );
}
