"use client";
import { motion } from "framer-motion";
import BracketLabel from "./BracketLabel";
import { riseItem, staggerParent, viewportOnce } from "./motion";

/**
 * Every section opens the same way: a bracketed eyebrow, a display title, and
 * an optional lead. The right column carries a mono note — the app puts the
 * same kind of state readout in the top-right of a screen header.
 */
export default function SectionHead({
  eyebrow,
  title,
  lead,
  note,
  tone = "red",
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  note?: string;
  tone?: "red" | "cyan" | "gold" | "faint";
}) {
  return (
    <motion.header
      className="sec-head"
      variants={staggerParent(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={viewportOnce}
    >
      <div>
        <motion.div variants={riseItem}>
          <BracketLabel tone={tone}>{eyebrow}</BracketLabel>
        </motion.div>
        <motion.h2 className="t-display" variants={riseItem}>
          {title}
        </motion.h2>
        {lead && (
          <motion.p className="t-lead" variants={riseItem}>
            {lead}
          </motion.p>
        )}
      </div>
      {note && (
        <motion.p className="t-mono sec-head-note" variants={riseItem}>
          {note}
        </motion.p>
      )}
    </motion.header>
  );
}
