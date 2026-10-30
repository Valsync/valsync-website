"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n";
import BracketLabel from "../hud/BracketLabel";
import Crosshair from "./Crosshair";
import DpiCalibrator from "./DpiCalibrator";
import ScenarioArena from "./scenario/ScenarioArena";
import { SCENARIOS, type ScenarioDef } from "./scenario/scenarios";
import { Engine, type Phase, type Stats } from "./engine";
import { MODES, summarize, tierFor, type ModeId, type ModeMeta } from "./modes";
import {
  DEFAULT_SETTINGS,
  cmPer360,
  loadHistory,
  loadSettings,
  parseCrosshairCode,
  pushRun,
  saveSettings,
  type RunRecord,
  type Settings,
  type TargetColor,
} from "./settings";
import "./aim.css";

type Result = { meta: ModeMeta; run: RunRecord; prevBest: number };
type Live = { stats: Stats; left: number | null; fps: number };

const best = (runs: RunRecord[] | undefined) => (runs?.length ? Math.max(...runs.map((r) => r.score)) : 0);
const pct = (f: number) => `${Math.round(f * 100)}%`;

function Spark({ runs }: { runs: RunRecord[] }) {
  if (runs.length < 2) return null;
  const pts = runs.slice(-20);
  const max = Math.max(...pts.map((r) => r.score), 1);
  const d = pts.map((r, i) => `${(i / (pts.length - 1)) * 100},${30 - (r.score / max) * 28}`).join(" ");
  return (
    <svg className="aim-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden>
      <polyline points={d} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function Arena({
  meta,
  settings,
  onResult,
  onExit,
  onNext,
}: {
  meta: ModeMeta;
  settings: Settings;
  onResult: (r: Result) => void;
  onExit: () => void;
  onNext: () => void;
}) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const engine = useRef<Engine | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [count, setCount] = useState(3);
  const [live, setLive] = useState<Live | null>(null);
  const [marker, setMarker] = useState<{ kind: string; n: number } | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [lockError, setLockError] = useState(false);
  const metaRef = useRef(meta);

  useEffect(() => {
    if (!host.current) return;
    const e = new Engine(host.current, settings, {
      onPhase: setPhase,
      onCountdown: setCount,
      onStats: (stats, left, fps) => setLive({ stats: { ...stats }, left, fps }),
      onHit: (kind) => setMarker((m) => ({ kind, n: (m?.n ?? 0) + 1 })),
      onEnd: (stats) => {
        const m = metaRef.current;
        const prev = best(loadHistory()[m.id]);
        const run = summarize(m, stats);
        pushRun(m.id, run);
        const r = { meta: m, run, prevBest: prev };
        setResult(r);
        onResult(r);
      },
      onLockError: () => setLockError(true),
    });
    e.applySettings(settings);
    engine.current = e;
    e.begin(meta.make());
    return () => {
      e.dispose();
      engine.current = null;
    };
    // The engine is built once per arena; settings are frozen during a run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lock = () => {
    setLockError(false);
    engine.current?.lock();
  };
  const restart = () => {
    setResult(null);
    setLockError(false);
    engine.current?.begin(metaRef.current.make());
    engine.current?.lock();
  };

  const s = live?.stats;
  const accuracy = s ? (meta.id === "track" ? (s.trackTotal ? s.trackOn / s.trackTotal : 0) : s.shots ? s.hits / s.shots : 1) : 1;
  const tier = result ? tierFor(result.meta, result.run.score) : null;
  const isBest = result ? result.run.score > result.prevBest : false;

  return (
    <div className="aim-arena" data-phase={phase}>
      <div ref={host} className="aim-host" onClick={phase === "paused" ? lock : undefined} />

      <Crosshair c={settings.crosshair} className={`aim-xhair${s?.onTarget ? " is-on" : ""}`} />
      {marker && <span key={marker.n} className={`aim-hitmark is-${marker.kind}`} aria-hidden />}

      <div className="aim-hud" aria-live="off">
        <div className="aim-hud-cell">
          <span>{t("aim.hud_mode")}</span>
          <b>{t(`aim.modes.${meta.id}.name`)}</b>
        </div>
        <div className="aim-hud-cell aim-hud-main">
          <span>{live?.left != null ? t("aim.hud_time") : t("aim.hud_round")}</span>
          <b>{live?.left != null ? live.left.toFixed(1) : s?.progress || "—"}</b>
        </div>
        <div className="aim-hud-cell">
          <span>{t("aim.hud_score")}</span>
          <b>{s?.score ?? 0}</b>
        </div>
        <div className="aim-hud-cell">
          <span>{t("aim.hud_acc")}</span>
          <b>{pct(accuracy)}</b>
        </div>
        <div className="aim-hud-cell aim-hud-fps">
          <span>FPS</span>
          <b>{live?.fps ?? 0}</b>
        </div>
      </div>

      {phase === "countdown" && <div className="aim-count">{count}</div>}

      {phase === "paused" && (
        <div className="aim-overlay" onClick={lock}>
          <div className="aim-card" onClick={(e) => e.stopPropagation()}>
            <BracketLabel tone="red">{t(`aim.modes.${meta.id}.name`)}</BracketLabel>
            <h2>{s && (s.shots || s.trackTotal) ? t("aim.paused") : t("aim.click_to_start")}</h2>
            <p>{t(`aim.modes.${meta.id}.how`)}</p>
            <div className="aim-actions">
              <button className="btn btn-primary" onClick={lock}>
                {s && (s.shots || s.trackTotal) ? t("aim.resume") : t("aim.start")}
              </button>
              <button className="btn btn-ghost" onClick={restart}>{t("aim.restart")}</button>
              <button className="btn btn-ghost" onClick={onExit}>{t("aim.exit")}</button>
            </div>
            {lockError && <p className="aim-lock-error">{t("aim.lock_error")}</p>}
            <p className="aim-fine">{t("aim.esc_hint")}</p>
          </div>
        </div>
      )}

      {phase === "done" && result && tier && (
        <div className="aim-overlay">
          <div className="aim-card aim-result">
            <BracketLabel tone="red">{t("aim.result")}</BracketLabel>
            <div className="aim-result-score">
              <b>{result.run.score.toLocaleString()}</b>
              {isBest && <span className="aim-pb">{t("aim.new_best")}</span>}
            </div>
            <div className="aim-tier" style={{ color: tier.color }}>{tier.name}</div>
            <dl className="aim-result-grid">
              <div><dt>{t("aim.hud_acc")}</dt><dd>{pct(result.run.accuracy)}</dd></div>
              {meta.id !== "track" && <div><dt>{t("aim.hits")}</dt><dd>{result.run.hits}/{result.run.shots}</dd></div>}
              {result.run.avgMs > 0 && <div><dt>{meta.id === "reflex" ? t("aim.avg_reaction") : t("aim.avg_ttk")}</dt><dd>{Math.round(result.run.avgMs)} ms</dd></div>}
              {(meta.id === "peek" || meta.id === "track") && <div><dt>{t("aim.headshots")}</dt><dd>{pct(result.run.headshotPct)}</dd></div>}
              <div><dt>{t("aim.best")}</dt><dd>{Math.max(result.prevBest, result.run.score).toLocaleString()}</dd></div>
            </dl>
            <Spark runs={loadHistory()[meta.id] ?? []} />
            <div className="aim-actions">
              <button className="btn btn-primary" onClick={restart}>{t("aim.retry")}</button>
              <button className="btn btn-ghost" onClick={onNext}>{t("aim.next")}</button>
              <button className="btn btn-ghost" onClick={onExit}>{t("aim.exit")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Range({ label, value, min, max, step, onChange, unit }: {
  label: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; unit?: string;
}) {
  return (
    <label className="aim-field">
      <span>{label}<em>{value}{unit}</em></span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}

const COLORS: TargetColor[] = ["red", "yellow", "purple", "cyan"];

export default function AimTrainer() {
  const { t } = useI18n();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [history, setHistory] = useState<Record<string, RunRecord[]>>({});
  const [selected, setSelected] = useState<ModeId>("grid");
  const [playing, setPlaying] = useState<ModeMeta | null>(null);
  const [scenario, setScenario] = useState<ScenarioDef | null>(null);
  const [tab, setTab] = useState<"sens" | "xhair" | "targets">("sens");
  const [code, setCode] = useState("");
  const [codeState, setCodeState] = useState<"" | "ok" | "bad">("");
  const [touchOnly, setTouchOnly] = useState(false);
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    // Storage and input type only exist on the client; reading them during
    // render would break hydration of the static export.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSettings(loadSettings());
    setHistory(loadHistory());
    setTouchOnly(!window.matchMedia("(any-pointer: fine)").matches);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);
  const updateX = (patch: Partial<Settings["crosshair"]>) => update({ crosshair: { ...settings.crosshair, ...patch } });
  const updateLines = (which: "inner" | "outer", patch: Partial<Settings["crosshair"]["inner"]>) =>
    updateX({ [which]: { ...settings.crosshair[which], ...patch } });

  const meta = MODES.find((m) => m.id === selected)!;
  const play = (m: ModeMeta) => {
    setSelected(m.id);
    setPlaying(m);
  };
  const next = () => {
    const i = MODES.findIndex((m) => m.id === playing?.id);
    const m = MODES[(i + 1) % MODES.length];
    setPlaying(null);
    // Remount the arena for the new mode on the next frame.
    requestAnimationFrame(() => play(m));
  };

  useEffect(() => {
    document.documentElement.classList.toggle("aim-playing", !!playing || !!scenario);
    return () => document.documentElement.classList.remove("aim-playing");
  }, [playing, scenario]);

  const importCode = () => {
    const parsed = parseCrosshairCode(code);
    if (parsed) updateX(parsed);
    setCodeState(parsed ? "ok" : "bad");
  };

  const edpi = Math.round(settings.sens * settings.dpi);
  const cm = cmPer360(settings.sens, settings.dpi);
  const x = settings.crosshair;

  return (
    <main id="content" className="aim-page">
      <section className="container aim-head">
        <BracketLabel tone="red">{t("aim.eyebrow")}</BracketLabel>
        <h1 className="t-display">{t("aim.title")}</h1>
        <p className="t-lead">{t("aim.lead")}</p>
        <ul className="aim-pills">
          <li>{t("aim.pill_sens")}</li>
          <li>{t("aim.pill_fov")}</li>
          <li>{t("aim.pill_xhair")}</li>
          <li>{t("aim.pill_local")}</li>
        </ul>
      </section>

      {touchOnly && <div className="container"><p className="aim-notice">{t("aim.touch_notice")}</p></div>}

      <section className="container scn-lobby">
        <div className="scn-lobby-head">
          <BracketLabel tone="red">{t("aim.scn.eyebrow")}</BracketLabel>
          <span className="aim-chip">{t("aim.scn.new")}</span>
        </div>
        {SCENARIOS.map((s) => {
          const runs = history[`scn:${s.id}`] ?? [];
          const b = best(runs);
          return (
            <article key={s.id} className="scn-tile">
              <div className="scn-tile-copy">
                <h2>{t(`aim.scn.list.${s.id}.name`)}</h2>
                <p>{t(`aim.scn.list.${s.id}.brief`)}</p>
                <ul className="aim-pills">
                  <li>{t("aim.scn.map")}: {s.map.name}</li>
                  <li>{t("aim.scn.weapon")}: {s.weapon.name}</li>
                  <li>{s.bots.length} {t("aim.scn.enemies")}</li>
                  <li>{s.duration}s</li>
                </ul>
              </div>
              <div className="scn-tile-side">
                <span className="aim-mode-foot">{t("aim.best")} <b>{b ? b.toLocaleString() : "—"}</b></span>
                <button className="btn btn-primary" disabled={touchOnly} onClick={() => setScenario(s)}>{t("aim.start")}</button>
              </div>
            </article>
          );
        })}
      </section>

      <section className="container aim-lobby">
        <div className="aim-modes">
          {MODES.map((m) => {
            const runs = history[m.id] ?? [];
            const b = best(runs);
            const tier = b ? tierFor(m, b) : null;
            return (
              <button
                key={m.id}
                className="aim-mode"
                aria-pressed={selected === m.id}
                onClick={() => setSelected(m.id)}
                onDoubleClick={() => !touchOnly && play(m)}
              >
                <span className="aim-mode-top">
                  <span className="aim-chip">{t(`aim.skills.${m.skill}`)}</span>
                  <span className="aim-mode-len">{m.length.endsWith("s") ? m.length : `${m.length} ${t("aim.rounds")}`}</span>
                </span>
                <span className="aim-mode-name">{t(`aim.modes.${m.id}.name`)}</span>
                <span className="aim-mode-desc">{t(`aim.modes.${m.id}.desc`)}</span>
                <span className="aim-mode-foot">
                  <span>
                    {t("aim.best")} <b>{b ? b.toLocaleString() : "—"}</b>
                  </span>
                  {tier && <span className="aim-mode-tier" style={{ color: tier.color }}>{tier.name}</span>}
                </span>
                <Spark runs={runs} />
              </button>
            );
          })}
        </div>

        <aside className="aim-side">
          <div className="aim-panel aim-launch">
            <BracketLabel tone="cyan">{t(`aim.skills.${meta.skill}`)}</BracketLabel>
            <h2>{t(`aim.modes.${meta.id}.name`)}</h2>
            <p>{t(`aim.modes.${meta.id}.how`)}</p>
            <button className="btn btn-primary aim-go" disabled={touchOnly} onClick={() => play(meta)}>
              {t("aim.start")}
            </button>
          </div>

          <div className="aim-panel">
            <div className="aim-tabs" role="tablist">
              {(["sens", "xhair", "targets"] as const).map((k) => (
                <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
                  {t(`aim.tab_${k}`)}
                </button>
              ))}
            </div>

            {tab === "sens" && (
              <div className="aim-form">
                <div className="aim-row">
                  <label className="aim-field">
                    <span>{t("aim.sens")}</span>
                    <input type="number" min={0.01} max={10} step={0.001} value={settings.sens}
                      onChange={(e) => update({ sens: Math.max(0.001, Number(e.target.value) || 0) })} />
                  </label>
                  <label className="aim-field">
                    <span>DPI</span>
                    <input type="number" min={100} max={32000} step={50} value={settings.dpi}
                      onChange={(e) => update({ dpi: Math.max(1, Number(e.target.value) || 0) })} />
                  </label>
                </div>
                {calibrating ? (
                  <DpiCalibrator
                    onUse={(dpi) => {
                      update({ dpi });
                      setCalibrating(false);
                    }}
                    onClose={() => setCalibrating(false)}
                  />
                ) : (
                  <button className="btn btn-ghost btn-sm" disabled={touchOnly} onClick={() => setCalibrating(true)}>
                    {t("aim.dpi.detect")}
                  </button>
                )}
                <dl className="aim-readout">
                  <div><dt>eDPI</dt><dd>{edpi}</dd></div>
                  <div><dt>cm/360°</dt><dd>{cm ? cm.toFixed(1) : "—"}</dd></div>
                </dl>
                <p className="aim-fine">{t("aim.sens_note")}</p>
              </div>
            )}

            {tab === "xhair" && (
              <div className="aim-form">
                <div className="aim-xpreview">
                  <Crosshair c={x} className="aim-xhair-preview" />
                </div>
                <label className="aim-field">
                  <span>{t("aim.code")}</span>
                  <div className="aim-inline">
                    <input type="text" value={code} placeholder="0;P;c;5;h;0;0l;4;0o;2;0a;1;1b;0" spellCheck={false}
                      onChange={(e) => { setCode(e.target.value); setCodeState(""); }} />
                    <button className="btn btn-ghost btn-sm" onClick={importCode}>{t("aim.import")}</button>
                  </div>
                  {codeState && <em className={`aim-code-${codeState}`}>{t(`aim.code_${codeState}`)}</em>}
                </label>
                <div className="aim-row">
                  <label className="aim-field">
                    <span>{t("aim.color")}</span>
                    <input type="color" value={x.color} onChange={(e) => updateX({ color: e.target.value })} />
                  </label>
                  <label className="aim-check"><input type="checkbox" checked={x.outline} onChange={(e) => updateX({ outline: e.target.checked })} />{t("aim.outline")}</label>
                  <label className="aim-check"><input type="checkbox" checked={x.dot} onChange={(e) => updateX({ dot: e.target.checked })} />{t("aim.dot")}</label>
                  <label className="aim-check"><input type="checkbox" checked={x.outer.show} onChange={(e) => updateLines("outer", { show: e.target.checked })} />{t("aim.outer")}</label>
                </div>
                <Range label={t("aim.length")} value={x.inner.length} min={0} max={20} step={1} onChange={(v) => updateLines("inner", { length: v })} />
                <Range label={t("aim.thickness")} value={x.inner.thickness} min={0} max={10} step={1} onChange={(v) => updateLines("inner", { thickness: v })} />
                <Range label={t("aim.gap")} value={x.inner.offset} min={0} max={20} step={1} onChange={(v) => updateLines("inner", { offset: v })} />
                <Range label={t("aim.opacity")} value={x.inner.alpha} min={0} max={1} step={0.05} onChange={(v) => updateLines("inner", { alpha: v })} />
                {x.dot && <Range label={t("aim.dot_size")} value={x.dotThickness} min={1} max={6} step={1} onChange={(v) => updateX({ dotThickness: v })} />}
              </div>
            )}

            {tab === "targets" && (
              <div className="aim-form">
                <Range label={t("aim.size")} value={settings.targetScale} min={0.6} max={1.6} step={0.05} unit="×" onChange={(v) => update({ targetScale: v })} />
                <div className="aim-field">
                  <span>{t("aim.target_color")}</span>
                  <div className="aim-swatches">
                    {COLORS.map((c) => (
                      <button key={c} className={`aim-swatch is-${c}`} aria-pressed={settings.targetColor === c}
                        aria-label={t(`aim.colors.${c}`)} title={t(`aim.colors.${c}`)} onClick={() => update({ targetColor: c })} />
                    ))}
                  </div>
                </div>
                <Range label={t("aim.volume")} value={Math.round(settings.volume * 100)} min={0} max={100} step={5} unit="%" onChange={(v) => update({ volume: v / 100 })} />
                <button className="btn btn-ghost btn-sm" onClick={() => update(DEFAULT_SETTINGS)}>{t("aim.reset")}</button>
              </div>
            )}
          </div>
        </aside>
      </section>

      <section className="container aim-faq">
        <p className="aim-fine">{t("aim.disclaimer")}</p>
      </section>

      {/* Portalled to <body>: the site's <main> is its own stacking context,
          which would otherwise trap the full-screen range under the nav. */}
      {scenario && createPortal(
        <ScenarioArena
          key={scenario.id}
          def={scenario}
          settings={settings}
          onExit={() => setScenario(null)}
          onResult={() => setHistory(loadHistory())}
        />,
        document.body,
      )}
      {playing && createPortal(
        <Arena
          key={playing.id}
          meta={playing}
          settings={settings}
          onResult={() => setHistory(loadHistory())}
          onExit={() => setPlaying(null)}
          onNext={next}
        />,
        document.body,
      )}
    </main>
  );
}
