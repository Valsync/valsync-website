"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import Panel from "./hud/Panel";
import BracketLabel from "./hud/BracketLabel";
import { riseItem, staggerParent, tapSpring, viewportOnce } from "./hud/motion";

const B = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/**
 * One plan, priced at nothing.
 *
 * The Pro and Enterprise tiers in lang/*.json are drafted but unshipped —
 * rendering them would put prices on the page for things nobody can buy, so
 * only Starter is on the site until those tiers actually exist.
 */
export default function Pricing() {
  const { t } = useI18n();

  return (
    <section className="section" id="pricing">
      <div className="container">
        <motion.div
          className="price-wrap"
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.div className="price-intro" variants={riseItem}>
            <BracketLabel tone="cyan">{t("pricing.eyebrow")}</BracketLabel>
            <h2 className="t-display" style={{ marginTop: 14 }}>
              {t("pricing.title")}
            </h2>
            <p className="t-lead" style={{ marginTop: 16 }}>
              {t("pricing.lead")}
            </p>
            <ul className="price-features" style={{ borderTop: 0, paddingTop: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <li key={i}>{t(`pricing.starter.feature_${i}`)}</li>
              ))}
            </ul>
          </motion.div>

          <Panel
            className="price-card"
            accent="red"
            fill="high"
            data-featured="true"
            brackets
            variants={riseItem}
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
          >
            <span className="price-badge">{t("pricing.badge_popular")}</span>

            <h3 className="t-headline">{t("pricing.starter.name")}</h3>
            <p className="t-body" style={{ marginTop: 8 }}>
              {t("pricing.starter.description")}
            </p>

            <div className="price-amount">
              <b>{t("pricing.free_price")}</b>
            </div>
            <p className="t-mono">{t("pricing.free_billing")}</p>

            <div className="price-note">
              <span className="t-micro">Platform</span>
              <span className="t-micro">Android</span>
              <span className="t-micro">Languages</span>
              <span className="t-micro c-cyan">4</span>
              <span className="t-micro">Card required</span>
              <span className="t-micro c-cyan">No</span>
            </div>

            <motion.a
              className="btn btn-primary"
              href={`${B}/#final`}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={tapSpring}
              style={{ marginTop: 26 }}
            >
              {t("pricing.starter.cta")}
            </motion.a>
          </Panel>
        </motion.div>
      </div>
    </section>
  );
}
