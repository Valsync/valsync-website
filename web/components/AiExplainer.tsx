"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";

const PROVIDERS = [
  { id: "chatgpt", name: "ChatGPT", url: "https://chatgpt.com/" },
  { id: "claude", name: "Claude", url: "https://claude.ai/new" },
  { id: "gemini", name: "Gemini", url: "https://gemini.google.com/app" },
  { id: "grok", name: "Grok", url: "https://grok.com/" },
  { id: "mistral", name: "Mistral", url: "https://chat.mistral.ai/chat" },
  { id: "perplexity", name: "Perplexity", url: "https://www.perplexity.ai/search" },
  { id: "deepseek", name: "DeepSeek", url: "https://chat.deepseek.com/" },
  { id: "qwen", name: "Qwen", url: "https://chat.qwen.ai/" },
];
const NO_PREFILL: Record<string, boolean> = { gemini: true, deepseek: true, qwen: true };

export default function AiExplainer({ doc }: { doc: "privacy" | "terms" }) {
  const { t, lang } = useI18n();
  const [links, setLinks] = useState<Record<string, string>>({});
  const [clipboard, setClipboard] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    const legal = document.querySelector("main .legal-article");
    const legalText = (legal as HTMLElement | null)?.innerText?.trim() ?? "";
    const pageUrl = location.href.split("#")[0];
    const docLabel = t(`legal.${doc}.title`);
    const tmpl = t("legal.ai.prompt");
    const shortPrompt = tmpl.split("{doc}").join(docLabel).split("{url}").join(pageUrl);
    const enc = encodeURIComponent(shortPrompt);
    const next: Record<string, string> = {};
    for (const p of PROVIDERS) {
      next[p.id] = p.url + (p.url.includes("?") ? "&" : "?") + "q=" + enc;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLinks(next);
    setClipboard("VALSYNC " + docLabel + "\nSource: " + pageUrl + "\n\n" + legalText);
  }, [doc, lang, t]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2800);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleClick = (p: (typeof PROVIDERS)[0]) => {
    try {
      navigator.clipboard.writeText(clipboard);
    } catch {}
    if (NO_PREFILL[p.id]) {
      setToast(t("legal.ai.toast").split("{provider}").join(p.name));
    }
  };

  return (
    <>
      <section className="ai-explain container" aria-label="AI explainer">
        <h2 className="t-headline">{t("legal.ai.title")}</h2>
        <p className="t-lead" style={{ marginTop: 10 }}>{t("legal.ai.lead")}</p>
        <p className="t-mono" style={{ marginTop: 12 }}>{t("legal.ai.note")}</p>
        <div className="ai-row">
          {PROVIDERS.map((p) => (
            <a
              key={p.id}
              className="ai-btn"
              href={links[p.id] || "#"}
              onClick={() => handleClick(p)}
              aria-label={p.name}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${new URL(p.url).hostname}&sz=32`}
                alt=""
              />
              {p.name}
            </a>
          ))}
        </div>
      </section>
      {toast && (
        <div className="ai-toast show" role="status">
          {toast}
        </div>
      )}
    </>
  );
}
