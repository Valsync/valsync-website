"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";

// Browsers never expose a mouse's DPI, so we measure it: the player slides
// the mouse across an object of known width while pointer lock counts the
// raw movement the mouse reports. Counts ÷ inches = DPI. Three passes, median.

const PASSES = 3;
const REFS = { card: 8.56, ruler: 10 } as const;
type Ref = keyof typeof REFS | "custom";
const COMMON = [400, 450, 500, 600, 800, 1000, 1200, 1600, 1800, 2000, 2400, 3200, 4000, 4800, 6400];

function median(xs: number[]) {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

export default function DpiCalibrator({ onUse, onClose }: { onUse: (dpi: number) => void; onClose: () => void }) {
  const { t } = useI18n();
  const box = useRef<HTMLDivElement>(null);
  const sum = useRef({ x: 0, y: 0 });
  const [ref, setRef] = useState<Ref>("card");
  const [custom, setCustom] = useState(10);
  const [live, setLive] = useState(false);
  const [counts, setCounts] = useState(0);
  const [passes, setPasses] = useState<number[]>([]);
  const [warn, setWarn] = useState<"" | "short" | "blocked">("");
  const [raw, setRaw] = useState<boolean | null>(null);

  const cm = ref === "custom" ? custom : REFS[ref];

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (document.pointerLockElement !== box.current) return;
      sum.current.x += e.movementX;
      sum.current.y += e.movementY;
      setCounts(Math.abs(sum.current.x));
    };
    const lockChange = () => setLive(document.pointerLockElement === box.current);
    document.addEventListener("mousemove", move);
    document.addEventListener("pointerlockchange", lockChange);
    return () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("pointerlockchange", lockChange);
      // The box remounts between passes, so match it by class, not by ref.
      if (document.pointerLockElement?.classList.contains("aim-dpi-box")) document.exitPointerLock();
    };
  }, []);

  const start = () => {
    const el = box.current;
    if (!el) return;
    sum.current = { x: 0, y: 0 };
    setCounts(0);
    setWarn("");
    type Lock = (o?: { unadjustedMovement?: boolean }) => Promise<void> | void;
    const request = el.requestPointerLock as Lock;
    const blocked = () => setWarn("blocked");
    try {
      const p = request.call(el, { unadjustedMovement: true });
      if (p && typeof p.then === "function") {
        p.then(() => setRaw(true)).catch(() => {
          // Raw input unsupported: measure what the OS cursor path reports.
          setRaw(false);
          const q = request.call(el);
          if (q && typeof q.catch === "function") q.catch(blocked);
        });
      } else setRaw(false);
    } catch {
      blocked();
    }
  };

  const stop = () => {
    const n = Math.abs(sum.current.x);
    document.exitPointerLock();
    if (n < 40) {
      setWarn("short");
      return;
    }
    setPasses((p) => [...p, n / (cm / 2.54)]);
  };

  const done = passes.length >= PASSES;
  const measured = done ? Math.round(median(passes) / 10) * 10 : 0;
  const nearest = COMMON.reduce((a, b) => (Math.abs(b - measured) < Math.abs(a - measured) ? b : a));
  const snap = Math.abs(nearest - measured) / measured <= 0.08 ? nearest : measured;

  return (
    <div className="aim-dpi">
      <p className="aim-fine">{t("aim.dpi.why")}</p>

      <div className="aim-row">
        <label className="aim-field">
          <span>{t("aim.dpi.ref")}</span>
          <select value={ref} disabled={passes.length > 0} onChange={(e) => setRef(e.target.value as Ref)}>
            <option value="card">{t("aim.dpi.ref_card")}</option>
            <option value="ruler">{t("aim.dpi.ref_ruler")}</option>
            <option value="custom">{t("aim.dpi.ref_custom")}</option>
          </select>
        </label>
        {ref === "custom" && (
          <label className="aim-field">
            <span>cm</span>
            <input type="number" min={2} max={60} step={0.1} value={custom} disabled={passes.length > 0}
              onChange={(e) => setCustom(Math.max(1, Number(e.target.value) || 0))} />
          </label>
        )}
      </div>

      {!done && (
        <>
          <p className="aim-dpi-step">
            <b>{t("aim.dpi.pass")} {passes.length + 1}/{PASSES}</b> {t("aim.dpi.step")}
          </p>
          <div
            ref={box}
            className="aim-dpi-box"
            data-live={live}
            role="button"
            tabIndex={0}
            onClick={live ? stop : start}
            onKeyDown={(e) => e.key === "Enter" && (live ? stop() : start())}
          >
            <span>{live ? t("aim.dpi.box_live") : t("aim.dpi.box_idle")}</span>
            {live && <b>{counts}</b>}
          </div>
          {warn && <p className="aim-lock-error">{t(warn === "short" ? "aim.dpi.too_short" : "aim.lock_error")}</p>}
          {passes.length > 0 && (
            <p className="aim-fine">{passes.map((p) => Math.round(p)).join(" · ")}</p>
          )}
        </>
      )}

      {done && (
        <>
          <dl className="aim-readout">
            <div><dt>{t("aim.dpi.result")}</dt><dd>{measured}</dd></div>
            <div><dt>{t("aim.dpi.suggest")}</dt><dd>{snap}</dd></div>
          </dl>
          <p className="aim-fine">{passes.map((p) => Math.round(p)).join(" · ")}</p>
          {raw === false && <p className="aim-fine">{t("aim.dpi.os_note")}</p>}
          <div className="aim-actions">
            <button className="btn btn-primary btn-sm" onClick={() => onUse(snap)}>{t("aim.dpi.use")}</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPasses([])}>{t("aim.dpi.redo")}</button>
          </div>
        </>
      )}

      <button className="btn btn-ghost btn-sm aim-dpi-close" onClick={onClose}>{t("aim.dpi.cancel")}</button>
    </div>
  );
}
