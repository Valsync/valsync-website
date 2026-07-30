"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

const plans = [
  {
    key: "starter",
    popular: true,
  },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: EASE_OUT },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.65, ease: EASE_OUT },
  },
};

const featureListVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.28,
    },
  },
};

const featureItemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

export default function Pricing() {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const B = process.env.NEXT_PUBLIC_BASE_PATH;

  return (
    <section className="section" id="pricing">
      <div className="container">
        <motion.div
          className="mx-auto max-w-[58ch] text-center"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
        >
          <motion.p className="eyebrow" variants={headerVariants}>
            {t("pricing.eyebrow")}
          </motion.p>
          <motion.h2 className="h2" variants={headerVariants}>
            {t("pricing.title")}
          </motion.h2>
          <motion.p className="lead mx-auto mt-4" variants={headerVariants}>
            VALSYNC is free for every player, during the public launch.
          </motion.p>
        </motion.div>

        <motion.div
          className="mt-14 grid grid-cols-1 gap-6 max-w-md mx-auto"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={containerVariants}
        >
          {plans.map((plan) => (
            <motion.article
              key={plan.key}
              variants={cardVariants}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : { y: -4, transition: { type: "spring", stiffness: 320, damping: 22 } }
              }
              className={cn(
                "card pricing-card relative flex flex-col p-7 md:p-8",
                plan.popular && "is-popular"
              )}
            >
              {plan.popular && (
                <span className="pricing-badge">
                  {t("pricing.badge_popular")}
                </span>
              )}

              <div className="text-center">
                <h3 className="h3">{t(`pricing.${plan.key}.name`)}</h3>
                <p className="pricing-desc">{t(`pricing.${plan.key}.description`)}</p>
              </div>

              <div className="relative mx-auto mt-6 flex h-16 items-baseline justify-center">
                <span className="pricing-price">{t("pricing.free_price")}</span>
              </div>

              <p className="pricing-billing">{t("pricing.free_billing")}</p>

              <motion.ul
                className="pricing-features"
                variants={featureListVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {[1, 2, 3, 4, 5].map((i) => (
                  <motion.li
                    key={i}
                    className="pricing-feature"
                    variants={featureItemVariants}
                  >
                    <span className="pricing-feature-check" aria-hidden>
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <span>{t(`pricing.${plan.key}.feature_${i}`)}</span>
                  </motion.li>
                ))}
              </motion.ul>

              <a
                href={`${B}/#final`}
                className={cn("btn mt-8 w-full", plan.popular ? "btn-primary" : "btn-secondary")}
              >
                {t(`pricing.${plan.key}.cta`)}
              </a>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
