"use client";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import SectionHead from "./hud/SectionHead";
import { riseItem, staggerParent } from "./hud/motion";

const KEYS = [
  "opgg",
  "ugg",
  "blitz",
  "mobalytics",
  "porofessor",
  "vlr",
  "thespike",
  "leetify",
  "faceit",
  "log",
] as const;

export default function Competitors() {
  const { t } = useI18n();

  return (
    <section className="section" id="competitors">
      <div className="container">
        <SectionHead
          eyebrow={t("competitors.eyebrow")}
          title={t("competitors.title")}
          lead={t("competitors.lead")}
          note="10 products · scope, issue, answer"
        />

        <motion.div
          variants={staggerParent(0.06)}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.05 }}
        >
          <motion.div className="comp-scroll" variants={riseItem}>
            <table className="comp-table">
              <thead>
                <tr>
                  <th scope="col">{t("competitors.col_product")}</th>
                  <th scope="col">{t("competitors.col_scope")}</th>
                  <th scope="col">{t("competitors.col_issue")}</th>
                  <th scope="col">{t("competitors.col_answer")}</th>
                </tr>
              </thead>
              <tbody>
                {KEYS.map((k) => (
                  <tr key={k}>
                    <td>
                      <span className="comp-name">{t(`competitors.${k}.name`)}</span>
                      <span className="kind" data-kind={t(`competitors.${k}.scope_kind`)}>
                        {t(`competitors.${k}.scope_kind`)}
                      </span>
                    </td>
                    <td className="fg-faint">{t(`competitors.${k}.scope`)}</td>
                    <td>{t(`competitors.${k}.issue`)}</td>
                    <td className="comp-answer">{t(`competitors.${k}.answer`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>

          <motion.p
            className="t-mono"
            variants={riseItem}
            style={{ marginTop: 20, maxWidth: "76ch", lineHeight: 1.6 }}
          >
            {t("competitors.disclaimer")}
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
