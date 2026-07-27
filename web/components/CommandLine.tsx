"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useI18n } from "@/lib/i18n";
import { POPULAR_PLAYERS, RECENT_PLAYERS, REGIONS, type PlayerPreview, type Region } from "@/lib/mock";

type State = "idle" | "loading" | "error" | "success";

function Row({ p, onPick }: { p: PlayerPreview; onPick: (p: PlayerPreview) => void }) {
  return (
    <button type="button" className="cmd-row" onClick={() => onPick(p)}>
      <span className="name mono">{p.name}<span className="tag">#{p.tag}</span></span>
      <span className="meta-line">
        <span className="chip rank">{p.rank}</span>
        <span className="chip region">{p.region}</span>
        <span className="chip">{p.agent}</span>
      </span>
    </button>
  );
}

export default function CommandLine({ onResult }: { onResult?: (p: PlayerPreview) => void }) {
  const { t } = useI18n();
  const [value, setValue] = useState("");
  const [region, setRegion] = useState<Region>("NA");
  const [focused, setFocused] = useState(false);
  const [state, setState] = useState<State>("idle");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setFocused(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const suggestions = useMemo(() => {
    if (!value.trim()) return [];
    const q = value.toLowerCase();
    return POPULAR_PLAYERS.filter((p) => `${p.name}#${p.tag}`.toLowerCase().includes(q));
  }, [value]);

  const run = (player?: PlayerPreview) => {
    const query = player ? `${player.name}#${player.tag}` : value.trim();
    if (!query) return;
    setValue(query);
    setFocused(false);
    setState("loading");
    window.setTimeout(() => {
      const found =
        player ||
        POPULAR_PLAYERS.find((p) => `${p.name}#${p.tag}`.toLowerCase() === query.toLowerCase()) ||
        POPULAR_PLAYERS.find((p) => p.name.toLowerCase() === query.split("#")[0]?.toLowerCase());
      if (found) {
        const withRegion = { ...found, region };
        onResult?.(withRegion);
        setState("success");
      } else {
        setState("error");
      }
    }, 900);
  };

  const showDrop = focused && state !== "loading" && state !== "success";

  return (
    <div ref={wrapRef}>
      <div className="cmd">
        <span className="cmd-prompt" aria-hidden>VALSYNC&nbsp;›</span>
        <input
          ref={inputRef}
          className="cmd-input"
          value={value}
          placeholder="TenZ#NA1"
          aria-label={t("search.placeholder")}
          onChange={(e) => { setValue(e.target.value); if (state !== "idle") setState("idle"); }}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <select className="cmd-region" value={region} aria-label={t("search.region")} onChange={(e) => setRegion(e.target.value as Region)}>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <button type="button" className="cmd-go" onClick={() => run()} disabled={state === "loading"}>
          {state === "loading" ? "..." : "Run"} <span aria-hidden>↵</span>
        </button>
      </div>

      <AnimatePresence>
        {showDrop && (
          <motion.div
            className="cmd-drop"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {state === "error" && <div className="cmd-error">No player found. Try TenZ#NA1 or aspas#BR1.</div>}
            {suggestions.length > 0 ? (
              <>
                <div className="group-label">{t("search.autocomplete")}</div>
                {suggestions.map((p) => <Row key={`s${p.name}${p.tag}`} p={p} onPick={run} />)}
              </>
            ) : (
              <>
                {!value && (
                  <>
                    <div className="group-label">{t("search.recent")}</div>
                    {RECENT_PLAYERS.map((p) => <Row key={`r${p.name}${p.tag}`} p={p} onPick={run} />)}
                  </>
                )}
                <div className="group-label">{t("search.popular")}</div>
                {POPULAR_PLAYERS.slice(0, 4).map((p) => <Row key={`p${p.name}${p.tag}`} p={p} onPick={run} />)}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {state === "loading" && (
        <div className="cmd-drop">
          <div className="cmd-skel"><div className="bar" /></div>
          <div className="cmd-skel"><div className="bar" /></div>
          <div className="cmd-skel"><div className="bar" /></div>
        </div>
      )}
    </div>
  );
}
