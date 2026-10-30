"use client";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n";
import BracketLabel from "../../hud/BracketLabel";
import Crosshair from "../Crosshair";
import { loadHistory, pushRun, type Settings } from "../settings";
import { ScenarioEngine, type Hud, type ScenarioResult, type ScnPhase } from "./engine";
import { drawMinimap } from "./map";
import type { ScenarioDef } from "./scenarios";

type Feed = { killer: string; victim: string; head: boolean; id: number };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function Stars({ on }: { on: boolean[] }) {
  return (
    <span className="scn-stars" aria-label={`${on.filter(Boolean).length}/3`}>
      {on.map((v, i) => (
        <svg key={i} viewBox="0 0 24 24" data-on={v} aria-hidden>
          <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z" />
        </svg>
      ))}
    </span>
  );
}

export default function ScenarioArena({
  def,
  settings,
  onExit,
  onResult,
}: {
  def: ScenarioDef;
  settings: Settings;
  onExit: () => void;
  onResult: () => void;
}) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const mini = useRef<HTMLCanvasElement>(null);
  const resultMap = useRef<HTMLCanvasElement>(null);
  const engine = useRef<ScenarioEngine | null>(null);
  const [phase, setPhase] = useState<ScnPhase>("ready");
  const [hud, setHud] = useState<Hud | null>(null);
  const [feed, setFeed] = useState<Feed[]>([]);
  const [marker, setMarker] = useState<{ kind: string; n: number } | null>(null);
  const [hurt, setHurt] = useState<{ angle: number; n: number } | null>(null);
  const [result, setResult] = useState<ScenarioResult | null>(null);
  const [best, setBest] = useState(0);
  const [lockError, setLockError] = useState(false);
  const key = `scn:${def.id}`;

  useEffect(() => {
    if (!host.current) return;
    const e = new ScenarioEngine(host.current, def, settings, {
      onPhase: setPhase,
      onHud: (h) => setHud({ ...h }),
      onFeed: (f) => setFeed((list) => [...list.slice(-3), f]),
      onHit: (kind) => setMarker((m) => ({ kind, n: (m?.n ?? 0) + 1 })),
      onHurt: (angle) => setHurt((h) => ({ angle, n: (h?.n ?? 0) + 1 })),
      onEnd: (r) => {
        const runs = loadHistory()[key] ?? [];
        setBest(runs.length ? Math.max(...runs.map((x) => x.score)) : 0);
        pushRun(key, {
          score: r.score,
          accuracy: r.shots ? r.hits / r.shots : 0,
          hits: r.hits,
          shots: r.shots,
          avgMs: r.kills.length ? (r.kills.at(-1)!.t * 1000) / r.kills.length : 0,
          headshotPct: r.kills.length ? r.headshots / r.kills.length : 0,
          at: Date.now(),
        });
        setResult(r);
        onResult();
      },
      onLockError: () => setLockError(true),
    });
    e.setMinimap(mini.current);
    engine.current = e;
    return () => {
      e.dispose();
      engine.current = null;
    };
    // One engine per arena; settings are frozen for the run.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Kill-feed entries age out.
  useEffect(() => {
    if (!feed.length) return;
    const id = window.setTimeout(() => setFeed((l) => l.slice(1)), 5000);
    return () => window.clearTimeout(id);
  }, [feed]);

  // Results minimap: where the survivors were when the round ended.
  useEffect(() => {
    const ctx = resultMap.current?.getContext("2d");
    if (ctx && result) drawMinimap(ctx, def.map, result.survivors, true);
  }, [result, def.map]);

  const lock = () => {
    setLockError(false);
    engine.current?.lock();
  };
  const retry = () => {
    setResult(null);
    setFeed([]);
    engine.current?.reset();
    lock();
  };

  const acc = hud && hud.shots ? Math.round((hud.hits / hud.shots) * 100) : null;
  const playing = phase === "live";
  const title = t(`aim.scn.list.${def.id}.name`);

  return (
    <div className="aim-arena scn" data-phase={phase}>
      <div ref={host} className="aim-host" />

      <canvas ref={mini} className="scn-mini" width={200} height={200} aria-hidden />
      <p className="scn-keys">{t("aim.scn.keys_hint")}</p>

      <div className="scn-top">
        <div><span>{t("aim.scn.kills")}</span><b>{hud?.kills ?? 0}/{hud?.total ?? def.bots.length}</b></div>
        <div className="scn-clock"><span>{t("aim.hud_time")}</span><b>{fmt(hud?.left ?? def.duration)}</b></div>
        <div><span>{t("aim.hud_acc")}</span><b>{acc === null ? "—" : `${acc}%`}</b></div>
      </div>

      <ul className="scn-feed" aria-live="polite">
        {feed.map((f) => (
          <li key={f.id} data-you={f.killer === "You"}>
            <b>{f.killer === "You" ? t("aim.scn.you") : f.killer}</b>
            <span aria-hidden>{f.head ? "◎" : "›"}</span>
            <b>{f.victim === "You" ? t("aim.scn.you") : f.victim}</b>
          </li>
        ))}
      </ul>

      <div className="scn-health" data-low={(hud?.health ?? 100) <= 30}>
        <b>{hud?.health ?? 100}</b>
        <i style={{ width: `${hud?.health ?? 100}%` }} />
      </div>
      <div className="scn-ammo">
        {hud?.reloading && <em>{t("aim.scn.reloading")}</em>}
        <b>{hud?.mag ?? def.weapon.mag}</b>
        <span>/ {hud?.reserve ?? def.weapon.reserve}</span>
        <small>{def.weapon.name}</small>
      </div>

      {playing && <Crosshair c={settings.crosshair} className="aim-xhair" />}
      {marker && playing && <span key={marker.n} className={`aim-hitmark is-${marker.kind === "body" ? "hit" : marker.kind}`} aria-hidden />}
      {hurt && playing && (
        <span key={hurt.n} className="scn-hurt" style={{ ["--a" as string]: `${-hurt.angle}rad` }} aria-hidden />
      )}

      {(phase === "ready" || phase === "paused") && (
        <div className="aim-overlay" onClick={lock}>
          <div className="aim-card scn-card" onClick={(e) => e.stopPropagation()}>
            <BracketLabel tone="red">{`${def.map.name} · ${def.weapon.name}`}</BracketLabel>
            <h2>{phase === "paused" ? t("aim.paused") : title}</h2>
            <p>{t(`aim.scn.list.${def.id}.brief`)}</p>
            <ul className="scn-goals">
              <li><Stars on={[true, false, false]} />{t("aim.scn.star1")}</li>
              <li><Stars on={[true, true, false]} />{t("aim.scn.star2").replace("{s}", String(def.par))}</li>
              <li><Stars on={[true, true, true]} />{t("aim.scn.star3")}</li>
            </ul>
            <dl className="scn-controls">
              <div><dt>WASD</dt><dd>{t("aim.scn.c_move")}</dd></div>
              <div><dt>Shift</dt><dd>{t("aim.scn.c_walk")}</dd></div>
              <div><dt>Ctrl / C</dt><dd>{t("aim.scn.c_crouch")}</dd></div>
              <div><dt>Space</dt><dd>{t("aim.scn.c_jump")}</dd></div>
              <div><dt>R</dt><dd>{t("aim.scn.c_reload")}</dd></div>
              <div><dt>Esc</dt><dd>{t("aim.scn.c_pause")}</dd></div>
            </dl>
            <div className="aim-actions">
              <button className="btn btn-primary" onClick={lock}>{phase === "paused" ? t("aim.resume") : t("aim.start")}</button>
              {phase === "paused" && <button className="btn btn-ghost" onClick={retry}>{t("aim.restart")}</button>}
              <button className="btn btn-ghost" onClick={onExit}>{t("aim.exit")}</button>
            </div>
            {lockError && <p className="aim-lock-error">{t("aim.lock_error")}</p>}
          </div>
        </div>
      )}

      {phase === "done" && result && (
        <div className="aim-overlay scn-result-wrap">
          <div className="scn-result" data-outcome={result.outcome}>
            <div className="scn-result-main">
              <BracketLabel tone={result.outcome === "win" ? "cyan" : "red"}>{title}</BracketLabel>
              <h2>{t(`aim.scn.outcome_${result.outcome}`)}</h2>
              <p className="scn-sub">
                {result.outcome === "dead" && result.killedBy
                  ? t("aim.scn.killed_by").replace("{name}", result.killedBy)
                  : t("aim.scn.cleared_in").replace("{s}", result.time.toFixed(1))}
              </p>
              <div className="scn-big">
                <b>{result.kills.length}</b>
                <span>/{result.total}</span>
                <em>{t("aim.scn.kills")}</em>
              </div>
              <div className="scn-bars" aria-hidden>
                {Array.from({ length: result.total }, (_, i) => <i key={i} data-on={i < result.kills.length} />)}
              </div>
              <div className="scn-starline">
                <Stars on={result.stars} />
                <span>
                  {t("aim.hud_score")} <b>{result.score}</b>
                  {result.score > best && <em className="aim-pb">{t("aim.new_best")}</em>}
                </span>
              </div>
              <div className="aim-actions">
                <button className="btn btn-primary" onClick={retry}>{t("aim.retry")}</button>
                <button className="btn btn-ghost" onClick={onExit}>{t("aim.exit")}</button>
              </div>
            </div>
            <div className="scn-result-side">
              <h3>{t("aim.scn.report")}</h3>
              <ol className="scn-report">
                {result.kills.map((k, i) => (
                  <li key={i}>
                    <span>{k.t.toFixed(1)} s</span>
                    <b>{k.name}</b>
                    {k.head && <em>{t("aim.headshots")}</em>}
                  </li>
                ))}
                {result.outcome === "dead" && result.killedBy && (
                  <li data-death>
                    <span>{result.time.toFixed(1)} s</span>
                    <b>{t("aim.scn.killed_by").replace("{name}", result.killedBy)}</b>
                  </li>
                )}
              </ol>
              <dl className="aim-result-grid">
                <div><dt>{t("aim.scn.health_left")}</dt><dd>{result.health}</dd></div>
                <div><dt>{t("aim.scn.head_kills")}</dt><dd>{result.headshots}/{result.kills.length}</dd></div>
                <div><dt>{t("aim.scn.shots")}</dt><dd>{result.shots}</dd></div>
                <div><dt>{t("aim.hud_acc")}</dt><dd>{result.shots ? Math.round((result.hits / result.shots) * 100) : 0}%</dd></div>
              </dl>
              {result.survivors.length > 0 && (
                <div className="scn-survivors">
                  <canvas ref={resultMap} width={260} height={260} aria-hidden />
                  <p>{t("aim.scn.survivors").replace("{n}", String(result.survivors.length))}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
