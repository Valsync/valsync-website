"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import SectionHead from "./hud/SectionHead";
import { easeOut } from "./hud/motion";

const IDS = ["1", "2", "3", "4", "5", "6"] as const;

export default function Faq() {
  const { t } = useI18n();
  const [open, setOpen] = useState<string | null>("1");

  return (
    <section className="section" id="faq">
      <div className="container">
        <SectionHead
          eyebrow="FAQ"
          title={t("faq.title")}
          note="Six questions we get asked before every install."
        />

        <div className="faq-list">
          {IDS.map((id) => {
            const isOpen = open === id;
            return (
              <div className="faq-item" key={id}>
                <h3 style={{ margin: 0 }}>
                  <button
                    className="faq-q"
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${id}`}
                    onClick={() => setOpen(isOpen ? null : id)}
                  >
                    <span>{t(`faq.q${id}`)}</span>
                    <span className="faq-sign" aria-hidden />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-a"
                      id={`faq-a-${id}`}
                      role="region"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.34, ease: easeOut }}
                    >
                      <p>{t(`faq.a${id}`)}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
