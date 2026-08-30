"use client";
import { useI18n } from "@/lib/i18n";
import { REGIONS } from "@/lib/mock";

/**
 * Player lookup is not offered from the site yet — the read-out lives in the
 * Android app. This renders the console as an inert preview: the input and the
 * region select are disabled and the button reads "coming soon".
 *
 * It used to simulate a search — a 900ms fake latency, a "Recent searches"
 * list implying history the site never had, and autocomplete over invented
 * stats for real pro players — so a visitor typing their own Riot ID was told
 * "Player not found". Nothing here queries anything; when the real lookup
 * ships, restore the input handlers and point them at the API.
 */
export default function CommandLine() {
  const { t } = useI18n();

  return (
    <div>
      <div className="cmd is-disabled" aria-disabled="true">
        <span className="cmd-prompt" aria-hidden>
          <span className="pip" />
          VALSYNC
        </span>
        <input
          className="cmd-input"
          value=""
          readOnly
          disabled
          placeholder="Player#NA1"
          aria-label={t("search.placeholder")}
        />
        <select className="cmd-region" value="NA" disabled aria-label={t("search.region")}>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <span className="cmd-go is-disabled">{t("common.soon")}</span>
      </div>
    </div>
  );
}
