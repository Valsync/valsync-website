"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

/**
 * Returns the UTC timestamp for "tomorrow at 12:00 in Europe/Istanbul".
 *
 * Istanbul switched to permanent UTC+3 in 2016, so the offset is stable and
 * we don't need to query it on every tick. Tomorrow 12:00 Istanbul equals
 * tomorrow 09:00 UTC.
 */
function getIstanbulTomorrowNoon(): number {
  const ISTANBUL_OFFSET_MS = 3 * 60 * 60 * 1000;
  const now = new Date();
  // Shift "now" into Istanbul's wall clock, then read its Y/M/D.
  const istanbulNow = new Date(now.getTime() + ISTANBUL_OFFSET_MS);
  const year = istanbulNow.getUTCFullYear();
  const month = istanbulNow.getUTCMonth();
  const day = istanbulNow.getUTCDate();
  // Tomorrow at 12:00 Istanbul -> tomorrow 09:00 UTC.
  return Date.UTC(year, month, day + 1, 9, 0, 0, 0);
}

type Parts = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function diff(target: number, now: number): Parts {
  let s = Math.max(0, Math.floor((target - now) / 1000));
  const days = Math.floor(s / 86400);
  s -= days * 86400;
  const hours = Math.floor(s / 3600);
  s -= hours * 3600;
  const minutes = Math.floor(s / 60);
  s -= minutes * 60;
  return { days, hours, minutes, seconds: s, done: target - now <= 0 };
}

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

export default function Countdown() {
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [minimized, setMinimized] = useState(false);
  // null on the server to avoid hydration mismatch, then a real timestamp on mount.
  const [now, setNow] = useState<number | null>(() =>
    typeof window === "undefined" ? null : Date.now()
  );
  // Locked to a stable target across re-renders so the value never jitters.
  const target = useMemo(() => getIstanbulTomorrowNoon(), []);

  // Tick every second.
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  // Watch the inline section: when it leaves the viewport, show the widget.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        // InView -> hide widget. Out of view -> show widget.
        setMinimized(!entry.isIntersecting);
      },
      { rootMargin: "-15% 0px -15% 0px", threshold: 0 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const parts: Parts = now == null
    ? { days: 0, hours: 0, minutes: 0, seconds: 0, done: false }
    : diff(target, now);

  // Compact widget reading: "00d : 00h : 00m : 00s" — drops days when 0 to keep it tight.
  const widgetReading = parts.days > 0
    ? `${pad(parts.days)}d : ${pad(parts.hours)}h : ${pad(parts.minutes)}m : ${pad(parts.seconds)}s`
    : `${pad(parts.hours)}h : ${pad(parts.minutes)}m : ${pad(parts.seconds)}s`;

  return (
    <>
      <section
        ref={sectionRef}
        className="section countdown-section"
        id="countdown"
        aria-labelledby="countdown-heading"
      >
        <div className="container">
          <div className="countdown-card" data-glow>
            <div className="countdown-head">
              <p className="eyebrow">{t("countdown.eyebrow")}</p>
              <h2 id="countdown-heading" className="countdown-title">{t("countdown.title")}</h2>
              <p className="countdown-target">
                <span className="countdown-target-dot" aria-hidden="true" />
                {t("countdown.target")}
              </p>
            </div>

            <div className="countdown-grid" role="timer" aria-live="off" aria-atomic="true">
              <Cell value={parts.days} label={t("countdown.days")} />
              <Sep />
              <Cell value={parts.hours} label={t("countdown.hours")} />
              <Sep />
              <Cell value={parts.minutes} label={t("countdown.minutes")} />
              <Sep />
              <Cell value={parts.seconds} label={t("countdown.seconds")} pulse />
            </div>

            <div className="countdown-foot">
              <span className="countdown-tag">{t("countdown.tag")}</span>
            </div>
          </div>
        </div>
      </section>

      <div
        className={`countdown-widget${minimized ? " is-visible" : ""}`}
        role="status"
        aria-live="polite"
        aria-hidden={!minimized}
      >
        <div className="countdown-widget-inner">
          <span className="countdown-widget-pulse" aria-hidden="true" />
          <span className="countdown-widget-label">{t("countdown.widget_label")}</span>
          <span className="countdown-widget-time num" suppressHydrationWarning>
            {widgetReading}
          </span>
          <span className="countdown-widget-divider" aria-hidden="true" />
          <span className="countdown-widget-target">{t("countdown.widget_target")}</span>
        </div>
      </div>
    </>
  );
}

function Cell({ value, label, pulse }: { value: number; label: string; pulse?: boolean }) {
  return (
    <div className={`countdown-cell${pulse ? " is-pulse" : ""}`}>
      <span className="countdown-cell-num num" suppressHydrationWarning>{pad(value)}</span>
      <span className="countdown-cell-label">{label}</span>
    </div>
  );
}

function Sep() {
  return <span className="countdown-sep" aria-hidden="true">:</span>;
}
