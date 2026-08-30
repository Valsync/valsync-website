"use client";
import { LOCALES, useI18n } from "@/lib/i18n";

// 28 locales will not fit as flat chips in a 56px nav bar, so the picker is a
// native <select> wearing the mono chip's clip-path. Native keeps keyboard and
// screen-reader behaviour, and the OS list handles 28 rows better than a
// hand-rolled popover would.
export default function LangSwitch() {
  const { lang, setLang } = useI18n();
  const current = LOCALES.find((l) => l.code === lang) ?? LOCALES[0];

  return (
    <div className="lang-switch">
      <span className="lang-current" aria-hidden>
        {current.label}
      </span>
      <select
        className="lang-select"
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        aria-label="Language"
      >
        {LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.name}
          </option>
        ))}
      </select>
      <svg className="lang-caret" width="8" height="5" viewBox="0 0 8 5" aria-hidden>
        <path d="M0 0h8L4 5z" fill="currentColor" />
      </svg>
    </div>
  );
}
