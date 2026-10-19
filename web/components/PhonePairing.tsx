"use client";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n";
type PairCode = { code: string; expiresAt: number };
export default function PhonePairing({ onPaired, onClose }: { onPaired: () => void; onClose: () => void }) {
  const { t } = useI18n();
  const [pair, setPair] = useState<PairCode | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    if (!pair) return;
    let active = true;
    const controller = new AbortController();
    const poll = async () => {
      if (pair.expiresAt <= Date.now()) { setExpired(true); return; }
      try {
        const result = await fetch("/.netlify/functions/web-pair?action=status", { credentials: "same-origin", cache: "no-store", signal: controller.signal });
        if (!result.ok) return;
        const data = await result.json();
        if (active && data.state === "paired") onPaired();
        if (active && data.state === "expired") setExpired(true);
      } catch { /* Poll failures are retried while the code remains valid. */ }
    };
    const interval = setInterval(() => void poll(), 3000);
    void poll();
    return () => { active = false; controller.abort(); clearInterval(interval); };
  }, [pair, onPaired]);
  async function start() {
    setBusy(true); setError(false); setExpired(false);
    try {
      const result = await fetch("/.netlify/functions/web-pair?action=start", { method: "POST", credentials: "same-origin", headers: { "X-ValSync-Request": "1" }, signal: AbortSignal.timeout(15000) });
      if (!result.ok) throw new Error("pair_failed");
      setPair(await result.json());
    } catch { setError(true); }
    finally { setBusy(false); }
  }
  return <section className="wc-panel wc-pair" aria-labelledby="pair-title">
    <div className="wc-section-head"><h2 id="pair-title">{t("companion.pairPhone")}</h2><button className="btn btn-ghost" onClick={onClose}>{t("companion.close")}</button></div>
    <p>{t("companion.pairInstructions")}</p><p>{t("companion.pairPrivacy")}</p>
    {pair && !expired && <><code className="wc-pair-code" dir="ltr">{pair.code}</code><p role="status">{t("companion.waitingPhone")}</p></>}
    {expired && <p role="status">{t("companion.pairExpired")}</p>}
    {error && <p role="alert">{t("companion.pairError")}</p>}
    {(!pair || expired) && <button className="btn btn-primary" onClick={() => void start()} disabled={busy}>{busy ? t("companion.loading") : t("companion.createCode")}</button>}
  </section>;
}
