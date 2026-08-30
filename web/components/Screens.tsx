"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import Panel from "./hud/Panel";
import SectionHead from "./hud/SectionHead";
import { easeOut, riseItem, staggerParent, viewportOnce } from "./hud/motion";

const B = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const SCREENS = [
  { key: "home", src: "screenshot-home.jpg" },
  { key: "store", src: "screenshot-store.jpg" },
  { key: "matches", src: "screenshot-matches.jpg" },
  { key: "loadout", src: "screenshot-loadout.jpg" },
  { key: "party", src: "screenshot-party.jpg" },
  { key: "social", src: "screenshot-social.jpg" },
] as const;

/**
 * The product gallery. Picking a row swaps the device; the accent bar is a
 * shared-layout element so it slides between rows rather than blinking from
 * one to the next.
 */
export default function Screens() {
  const { t } = useI18n();
  const [active, setActive] = useState(0);
  const current = SCREENS[active];

  return (
    <section className="section" id="app">
      <div className="container">
        <SectionHead
          eyebrow={t("screens.eyebrow")}
          title={t("screens.title")}
          lead={t("screens.lead")}
          note={t("screens.note")}
          tone="cyan"
        />

        <motion.div
          className="screens-wrap"
          variants={staggerParent(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.ul className="screen-list" variants={riseItem}>
            {SCREENS.map((s, i) => {
              const isActive = i === active;
              return (
                <li key={s.key}>
                  <button
                    className="screen-row"
                    data-active={isActive}
                    onClick={() => setActive(i)}
                    aria-expanded={isActive}
                  >
                    {isActive && (
                      <motion.span
                        className="screen-bar"
                        layoutId="screen-bar"
                        transition={{ type: "spring", stiffness: 380, damping: 34 }}
                        aria-hidden
                      />
                    )}
                    <span className="screen-index mono">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="screen-copy">
                      <span className="screen-name">{t(`screens.${s.key}.name`)}</span>
                      <AnimatePresence initial={false}>
                        {isActive && (
                          <motion.span
                            className="screen-desc"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.36, ease: easeOut }}
                          >
                            <span>{t(`screens.${s.key}.desc`)}</span>
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </span>
                  </button>
                </li>
              );
            })}
          </motion.ul>

          <motion.div className="screen-stage" variants={riseItem}>
            <Panel
              className="screen-device"
              fill="deep"
              accent="cyan"
              brackets
              grid
            >
              <div className="screen-device-shot">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.img
                    key={current.src}
                    src={`${B}/img/${current.src}`}
                    alt={`VALSYNC ${t(`screens.${current.key}.name`)}`}
                    width={1080}
                    height={2400}
                    loading="lazy"
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.42, ease: easeOut }}
                  />
                </AnimatePresence>
              </div>
              <p className="screen-caption t-micro">
                {t(`screens.${current.key}.name`)}
              </p>
            </Panel>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
