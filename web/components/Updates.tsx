"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { UPDATES } from "@/lib/mock";
import SectionHead from "./hud/SectionHead";
import { slideItem, staggerParent } from "./hud/motion";

export default function Updates() {
  const { t } = useI18n();

  return (
    <section className="section" id="updates">
      <div className="container">
        <SectionHead
          eyebrow={t("recent.eyebrow")}
          title={t("recent.title")}
          note={t("recent.lead")}
        />

        <motion.div
          className="log"
          variants={staggerParent(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
        >
          {UPDATES.map((u) => (
            <motion.article className="log-row" key={u.version} variants={slideItem}>
              <span className="log-version">{u.version}</span>
              <span
                className="chip chip-static"
                data-active={u.tag === "latest"}
                style={{ justifySelf: "start" }}
              >
                {u.tag === "latest" ? t("recent.latest") : t("recent.shipped")}
              </span>
              <p className="log-body">{u.body}</p>
              <time className="t-mono" dateTime={u.date}>
                {u.date}
              </time>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
