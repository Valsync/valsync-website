"use client";
import { useI18n } from "@/lib/i18n";
import AiExplainer from "./AiExplainer";

type Item = { type: "h" | "p" | "ul"; n: number; count?: number };

const STRUCTURES: Record<string, Item[]> = {
  privacy: [
    { type: "h", n: 1 }, { type: "p", n: 1 },
    { type: "h", n: 2 }, { type: "p", n: 2 }, { type: "ul", n: 1, count: 5 },
    { type: "h", n: 3 }, { type: "p", n: 3 },
    { type: "h", n: 4 }, { type: "p", n: 4 },
    { type: "h", n: 5 }, { type: "p", n: 5 }, { type: "ul", n: 2, count: 2 },
    { type: "h", n: 6 }, { type: "p", n: 6 },
    { type: "h", n: 7 }, { type: "p", n: 7 }, { type: "ul", n: 3, count: 1 }, { type: "p", n: 8 },
    { type: "h", n: 8 }, { type: "p", n: 9 },
    { type: "h", n: 9 }, { type: "p", n: 10 },
    { type: "h", n: 10 }, { type: "p", n: 11 },
    { type: "h", n: 11 }, { type: "p", n: 12 },
    { type: "h", n: 12 }, { type: "p", n: 13 },
  ],
  terms: [
    { type: "h", n: 1 }, { type: "p", n: 1 },
    { type: "h", n: 2 }, { type: "p", n: 2 },
    { type: "h", n: 3 }, { type: "p", n: 3 },
    { type: "h", n: 4 }, { type: "p", n: 4 }, { type: "ul", n: 1, count: 4 },
    { type: "h", n: 5 }, { type: "p", n: 5 },
    { type: "h", n: 6 }, { type: "p", n: 6 },
    { type: "h", n: 7 }, { type: "p", n: 7 },
    { type: "h", n: 8 }, { type: "p", n: 8 },
    { type: "h", n: 9 }, { type: "p", n: 9 },
    { type: "h", n: 10 }, { type: "p", n: 10 },
    { type: "h", n: 11 }, { type: "p", n: 11 },
  ],
};

const HEADINGS: Record<string, Record<number, string>> = {
  privacy: {
    1: "Commitment", 2: "Information We Do Not Collect", 3: "Riot Authentication",
    4: "Game Data", 5: "Optional Features", 6: "Source Code",
    7: "Third-Party Services", 8: "Children's Privacy", 9: "Data Security",
    10: "Your Rights", 11: "Policy Changes", 12: "Contact",
  },
  terms: {
    1: "Acceptance", 2: "Description of Service", 3: "Riot Games Relationship",
    4: "User Responsibilities", 5: "Privacy & Data", 6: "Intellectual Property",
    7: "Disclaimer", 8: "Limitation of Liability", 9: "Modifications",
    10: "Termination", 11: "Contact",
  },
};

export default function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const { t, th } = useI18n();
  const items = STRUCTURES[doc];
  const labels = HEADINGS[doc];
  const toc = items
    .filter((i) => i.type === "h")
    .map((i) => ({ n: i.n, label: labels[i.n] }));
  const eyebrow = doc === "privacy" ? "Legal · Privacy" : "Legal · Terms";

  return (
    <main id="content" className="legal-page">
      <AiExplainer doc={doc} />

      <section className="legal-head">
        <div className="container">
          <p className="eyebrow"><span className="dot" /> {eyebrow}</p>
          <h1 className="h1" style={{ marginTop: 16 }}>{t(`legal.${doc}.title`)}</h1>
          <p className="meta text-mute" style={{ marginTop: 12 }}>{t(`legal.${doc}.updated`)}</p>
        </div>
      </section>

      <section className="legal-body">
        <div className="container legal-grid">
          <aside className="legal-toc" aria-label="On this page">
            <p className="eyebrow">Sections</p>
            <ol>
              {toc.map((h, i) => (
                <li key={h.n}>
                  <a href={`#sec-${h.n}`}>
                    <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    <span>{h.label}</span>
                  </a>
                </li>
              ))}
            </ol>
          </aside>

          <article className="legal-article">
            {items.map((item, i) => {
              if (item.type === "h") {
                return (
                  <h2 key={i} id={`sec-${item.n}`} className="legal-h">
                    <span className="legal-h-num">{String(item.n).padStart(2, "0")}</span>
                    <span dangerouslySetInnerHTML={th(`legal.${doc}.h${item.n}`)} />
                  </h2>
                );
              }
              if (item.type === "p") {
                return (
                  <p
                    key={i}
                    className="legal-p"
                    dangerouslySetInnerHTML={th(`legal.${doc}.p${item.n}`)}
                  />
                );
              }
              return (
                <ul key={i} className="legal-list">
                  {Array.from({ length: item.count! }, (_, j) => (
                    <li
                      key={j}
                      className="legal-li"
                      dangerouslySetInnerHTML={th(`legal.${doc}.ul${item.n}.li${j + 1}`)}
                    />
                  ))}
                </ul>
              );
            })}
          </article>
        </div>
      </section>
    </main>
  );
}
