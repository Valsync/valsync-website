"use client";
import en from "@/lang/en.json";
import AiExplainer from "./AiExplainer";
import BracketLabel from "./hud/BracketLabel";

type Item = { type: "h" | "p" | "ul"; n: number; count?: number };

const STRUCTURES: Record<string, Item[]> = {
  privacy: [
    { type: "h", n: 1 }, { type: "p", n: 1 },
    { type: "h", n: 2 }, { type: "p", n: 2 }, { type: "ul", n: 1, count: 4 },
    { type: "h", n: 3 }, { type: "p", n: 3 }, { type: "ul", n: 2, count: 2 },
    { type: "h", n: 4 }, { type: "p", n: 4 },
    { type: "h", n: 5 }, { type: "p", n: 5 },
    { type: "h", n: 6 }, { type: "p", n: 6 },
    { type: "h", n: 7 }, { type: "p", n: 7 },
    { type: "h", n: 8 }, { type: "p", n: 8 },
    { type: "h", n: 9 }, { type: "p", n: 9 },
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
    1: "Data used to provide VALSYNC", 2: "Data stored on your device",
    3: "Optional support and feedback", 4: "Analytics, referrals, and advertising",
    5: "Other services and web content", 6: "Sharing and sale", 7: "Security",
    8: "Your choices and deletion requests", 9: "Children, changes, and contact",
  },
  terms: {
    1: "Acceptance", 2: "Description of Service", 3: "Riot Games Relationship",
    4: "User Responsibilities", 5: "Privacy & Data", 6: "Intellectual Property",
    7: "Disclaimer", 8: "Limitation of Liability", 9: "Modifications",
    10: "Termination", 11: "Contact",
  },
};

export default function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const items = STRUCTURES[doc];
  const labels = HEADINGS[doc];
  const toc = items
    .filter((i) => i.type === "h")
    .map((i) => ({ n: i.n, label: labels[i.n] }));
  const eyebrow = doc === "privacy" ? "Legal · Privacy" : "Legal · Terms";
  const legalCopy = en.legal[doc] as unknown as Record<string, unknown>;
  const policyText = (path: string): string => {
    const value = path.split(".").reduce<unknown>((current, key) => (
      current && typeof current === "object"
        ? (current as Record<string, unknown>)[key]
        : undefined
    ), legalCopy);
    return typeof value === "string" ? value : path;
  };

  return (
    <main id="content" className="legal-page">
      <AiExplainer doc={doc} />

      <section className="legal-head">
        <div className="container">
          <BracketLabel tone="red">{eyebrow}</BracketLabel>
          <h1 className="t-display-lg" style={{ marginTop: 16 }}>{policyText("title")}</h1>
          <p className="t-mono" style={{ marginTop: 14 }}>{policyText("updated")}</p>
        </div>
      </section>

      <section className="legal-body">
        <div className="container legal-grid">
          <aside className="legal-toc" aria-label="On this page">
            <p className="t-micro" style={{ marginBottom: 14 }}>Sections</p>
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
                  // The heading copy is already numbered ("1. Our Commitment"),
                  // so there is no separate index column here.
                  <h2 key={i} id={`sec-${item.n}`} className="legal-h">
                    <span dangerouslySetInnerHTML={{ __html: policyText(`h${item.n}`) }} />
                  </h2>
                );
              }
              if (item.type === "p") {
                return (
                  <p
                    key={i}
                    className="legal-p"
                    dangerouslySetInnerHTML={{ __html: policyText(`p${item.n}`) }}
                  />
                );
              }
              return (
                <ul key={i} className="legal-list">
                  {Array.from({ length: item.count! }, (_, j) => (
                    <li
                      key={j}
                      className="legal-li"
                      dangerouslySetInnerHTML={{ __html: policyText(`ul${item.n}.li${j + 1}`) }}
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
