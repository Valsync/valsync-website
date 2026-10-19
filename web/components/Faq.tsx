"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import SectionHead from "./hud/SectionHead";
import { easeOut } from "./hud/motion";

const IDS = ["1", "2", "3", "4", "5", "6"] as const;
const QUESTIONS = [
  ["Do I need a Riot account?", "Public reference content and this prototype need no account. Personal stats, loadout, party, social and Premier features require Riot sign-in in the Android app."],
  ["Which platforms does Valsync support?", "Valsync is an Android app. This website provides product information and an illustrative reviewer walkthrough."],
  ["What can I check in the app?", "The current navigation covers Home, History, Loadout, Party, Social, Wiki and Premier. Personal store and Night Market tracking have been removed."],
  ["Can I see opponents before a match?", "No. During agent select, the app shows the player and allies. It does not identify or analyze opponents before a match starts."],
  ["Can I manage a party?", "The signed-in player can create or join a party, invite friends, share a code and start matchmaking. These actions use Riot's internal services and require Riot review."],
  ["How does Valsync handle data?", "Riot tokens are encrypted on the Android device. The app also uses optional analytics, ads, support services and local chat history. Read the Privacy Policy for details."],
] as const;

export default function Faq() {
  const [open, setOpen] = useState<string | null>("1");

  return (
    <section className="section" id="faq">
      <div className="container">
        <SectionHead
          eyebrow="FAQ"
          title="Questions before you install."
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
                    <span>{QUESTIONS[Number(id) - 1][0]}</span>
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
                      <p>{QUESTIONS[Number(id) - 1][1]}</p>
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
