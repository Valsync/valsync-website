"use client";
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import en from "@/lang/en.json";

/**
 * The site ships the same locale set as the Android app (see the app's
 * res/xml/locales_config.xml). `code` is the BCP-47 tag and the `lang/*.json`
 * filename; `label` is the 2-3 char mono chip in the nav; `name` is the
 * endonym shown in the picker.
 */
export const LOCALES = [
  { code: "en", label: "EN", name: "English" },
  { code: "ar", label: "AR", name: "العربية" },
  { code: "cs", label: "CS", name: "Čeština" },
  { code: "da", label: "DA", name: "Dansk" },
  { code: "de", label: "DE", name: "Deutsch" },
  { code: "es", label: "ES", name: "Español" },
  { code: "es-419", label: "419", name: "Español (Latinoamérica)" },
  { code: "fi", label: "FI", name: "Suomi" },
  { code: "fr", label: "FR", name: "Français" },
  { code: "hi", label: "HI", name: "हिन्दी" },
  { code: "hu", label: "HU", name: "Magyar" },
  { code: "id", label: "ID", name: "Bahasa Indonesia" },
  { code: "it", label: "IT", name: "Italiano" },
  { code: "ja", label: "JA", name: "日本語" },
  { code: "ko", label: "KO", name: "한국어" },
  { code: "nl", label: "NL", name: "Nederlands" },
  { code: "no", label: "NO", name: "Norsk" },
  { code: "pl", label: "PL", name: "Polski" },
  { code: "pt-BR", label: "BR", name: "Português (Brasil)" },
  { code: "ro", label: "RO", name: "Română" },
  { code: "ru", label: "RU", name: "Русский" },
  { code: "sk", label: "SK", name: "Slovenčina" },
  { code: "sv", label: "SV", name: "Svenska" },
  { code: "th", label: "TH", name: "ไทย" },
  { code: "tr", label: "TR", name: "Türkçe" },
  { code: "uk", label: "UK", name: "Українська" },
  { code: "vi", label: "VI", name: "Tiếng Việt" },
  { code: "zh-CN", label: "ZH", name: "简体中文" },
] as const;

const CODES = LOCALES.map((l) => l.code) as readonly string[];
const RTL_LANGS = ["ar"];

type Dict = Record<string, unknown>;

// English is bundled — it is the SSR render and the fallback for any key a
// translation is missing. The other 27 are fetched on demand, so a visitor
// downloads at most one extra locale instead of all 28.
const CACHE: Record<string, Dict> = { en: en as Dict };

async function loadDict(code: string): Promise<Dict> {
  const hit = CACHE[code];
  if (hit) return hit;
  const mod = await import(`../lang/${code}.json`);
  const dict = (mod.default ?? mod) as Dict;
  CACHE[code] = dict;
  return dict;
}

/** Resolve a browser tag like `pt-PT` or `zh-Hans-CN` to a shipped locale. */
function matchLocale(tag: string | null | undefined): string | null {
  if (!tag) return null;
  const t = tag.toLowerCase();
  const exact = CODES.find((c) => c.toLowerCase() === t);
  if (exact) return exact;
  const base = t.split("-")[0];
  return (
    CODES.find((c) => c.toLowerCase() === base) ??
    CODES.find((c) => c.toLowerCase().startsWith(`${base}-`)) ??
    null
  );
}

function walk(obj: Dict, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") return (acc as Dict)[key];
    return undefined;
  }, obj);
}

function lookup(dict: Dict, path: string): string {
  const val = walk(dict, path);
  if (typeof val === "string") return val;
  // Fall back to English rather than printing the raw key at the user.
  const fallback = walk(en as Dict, path);
  return typeof fallback === "string" ? fallback : path;
}

type I18nCtx = {
  lang: string;
  setLang: (l: string) => void;
  t: (k: string) => string;
  th: (k: string) => { __html: string };
  dir: string;
};

const I18nContext = createContext<I18nCtx>({
  lang: "en",
  setLang: () => {},
  t: (k) => k,
  th: (k) => ({ __html: k }),
  dir: "ltr",
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState("en");
  const [dict, setDict] = useState<Dict>(en as Dict);

  useEffect(() => {
    const stored = localStorage.getItem("valsync-lang");
    const query = new URLSearchParams(window.location.search).get("lang");
    const nav = navigator.language;
    const initial =
      [query, stored].map(matchLocale).find(Boolean) || matchLocale(nav) || "en";
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initial !== "en") setLangState(initial);
  }, []);

  // The dictionary trails the language by one async tick; until it lands the
  // English copy stays on screen rather than a flash of raw keys.
  useEffect(() => {
    let stale = false;
    loadDict(lang)
      .then((d) => {
        if (!stale) setDict(d);
      })
      .catch(() => {
        if (!stale) setDict(en as Dict);
      });
    return () => {
      stale = true;
    };
  }, [lang]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
    localStorage.setItem("valsync-lang", lang);
  }, [lang]);

  const setLang = useCallback((l: string) => setLangState(l), []);

  const value = useMemo<I18nCtx>(
    () => ({
      lang,
      setLang,
      t: (k: string) => lookup(dict, k),
      th: (k: string) => ({ __html: lookup(dict, k) }),
      dir: RTL_LANGS.includes(lang) ? "rtl" : "ltr",
    }),
    [lang, dict, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
