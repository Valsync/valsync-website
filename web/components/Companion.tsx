"use client";
import { useEffect, useState, type CSSProperties } from "react";
import { Crosshair, LayoutDashboard, LogIn, LogOut, RefreshCw } from "lucide-react";
import { ApiError, COMPANION_CANONICAL_URL, getData, mutateSession, useResource } from "@/lib/companion";
import type { CatalogData, CatalogItem, DashboardData, MatchDetail, MatchesData, MatchSummary, SessionData, TiersData } from "@/lib/companion-types";
import { agentPrimary } from "@/lib/agent-theme";
import { useI18n } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";
import PhonePairing from "./PhonePairing";
import "./companion.css";

// Account-first web companion: Riot sign-in is the only entry point, and the
// signed-in session only unlocks the player's own stats and match history.
// The phone pairing code survives as an automatic fallback for deployments
// where the session endpoint reports Riot sign-in as unavailable.
const sections = ["dashboard", "matches"] as const;
type Section = typeof sections[number];
const icons = [LayoutDashboard, Crosshair];
const signInHref = "/.netlify/functions/riot-auth-start";
type Route = { section: Section; id: string; start: number; queue: string; agent: string; map: string; date: string; auth: string };
const initial: Route = { section: "dashboard", id: "", start: 0, queue: "competitive", agent: "", map: "", date: "", auth: "" };
function readRoute(): Route {
  const q = new URLSearchParams(window.location.search);
  return { section: sections.includes(q.get("section") as Section) ? q.get("section") as Section : "dashboard", id: q.get("id") ?? "", start: Math.max(0, Math.min(1000, Number(q.get("start")) || 0)), queue: q.get("queue") ?? "competitive", agent: q.get("agent") ?? "", map: q.get("map") ?? "", date: q.get("date") ?? "", auth: q.get("auth") ?? "" };
}
function useRoute() {
  const [route, setRoute] = useState(initial);
  useEffect(() => {
    const sync = () => setRoute(readRoute());
    Promise.resolve().then(sync);
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  function navigate(patch: Partial<Route>) {
    const next = { ...route, auth: "", ...patch };
    const q = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(next)) { if (value === "" || value === 0) q.delete(key); else q.set(key, String(value)); }
    window.history.pushState(null, "", `${window.location.pathname}?${q}`);
    setRoute(next);
  }
  return { route, navigate };
}
const display = (value: number | null | undefined) => value == null ? "—" : Number.isInteger(value) ? String(value) : value.toFixed(2);
function Notice({ text, alert = false }: { text: string; alert?: boolean }) { return <p className="wc-notice" role={alert ? "alert" : "status"}>{text}</p>; }

// The app's HistoryMatchRow dates a match relatively ("42 min ago",
// "Yesterday"). Intl.RelativeTimeFormat reads the same way without adding
// copy to the 28 locales the site ships; past a week the site falls back to
// the absolute date, which the app never shows.
function relativeDate(value: number | null, lang: string): string {
  if (value === null) return "—";
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const minutes = Math.round((value - Date.now()) / 60000);
  if (Math.abs(minutes) < 1) return rtf.format(0, "second");
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 7) return rtf.format(days, "day");
  return new Intl.DateTimeFormat(lang, { dateStyle: "medium" }).format(new Date(value));
}

// The agent portrait: a 56px cut-corner tile ringed in that agent's own kit
// color, with the agent's initials as the fallback when the art is missing.
// Mirrors the app's Current Act card: win rate and matches played are the act record from
// Riot's season block; K/D and PS come from the latest ranked page. Older phone snapshots
// carry neither the act record nor PS, so they fall back to the sample and ACS.
function DashboardStats({ perf, t, date }: { perf: DashboardData["performance"]; t: (key: string) => string; date: (v: number | null) => string }) {
  const act = perf.actMatches != null;
  const played = act ? perf.actMatches! : perf.sampleSize;
  const wins = act ? perf.actWins ?? perf.wins : perf.wins;
  const winRate = perf.winRate ?? (played ? wins / played * 100 : null);
  const tiles: [string, string][] = [
    [t("companion.winRate"), winRate === null ? "—" : `${Math.floor(winRate)}%`],
    ["K / D", perf.kd === null ? "—" : perf.kd.toFixed(2)],
    perf.ps != null ? [t("companion.ps"), String(perf.ps)] : [t("companion.acs"), perf.acs === null ? "—" : String(Math.round(perf.acs))],
    [t("companion.played"), String(played)],
  ];
  return <>
    <p className="wc-meta">{act ? `${t("companion.currentAct")} · ${t("companion.rankedSample")} (${perf.sampleSize})` : `${t("companion.sample")} · ${perf.sampleSize}`} · {date(perf.from)} — {date(perf.to)}</p>
    <div className="wc-stats">{tiles.map(([label, value]) => <div className="wc-panel" key={label}><p className="wc-eyebrow">{label}</p><strong className="wc-value">{value}</strong></div>)}</div>
  </>;
}
function AgentTile({ agent, ring }: { agent: CatalogItem | undefined; ring: string }) {
  const [failed, setFailed] = useState(false);
  const initials = (agent?.name ?? "?").slice(0, 2).toUpperCase();
  return <span className="wc-card-portrait" style={{ "--wc-agent": ring } as CSSProperties} aria-hidden>
    <span className="wc-card-portrait-inner">
      {agent?.image && !failed
        ? <img src={agent.image} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
        : <span className="wc-card-initials">{initials}</span>}
    </span>
  </span>;
}

// Riot's queue ids double as companion copy keys, so the chip can read in
// every shipped locale. Anything else (custom games, unreleased modes) falls
// back to the raw id.
const QUEUE_KEYS = ["competitive", "unrated", "swiftplay", "spikerush", "deathmatch", "ggteam", "premier"];

// The match row mirrors the app's HistoryMatchRow: the map art bleeds in from
// the trailing edge under a gradient scrim, a result rail runs down the
// leading edge, the agent portrait wears that agent's own kit color, and the
// score / K-D-A / K-D stack reads right-aligned in the outcome color.
function MatchRows({ rows, lookup, when, onSelect }: { rows: MatchSummary[]; lookup: (kind: "agents" | "maps", id: string) => CatalogItem | undefined; when: (value: number | null) => string; onSelect: (id: string) => void }) {
  const { t, lang } = useI18n();
  return <div className="wc-card-list">{rows.map(m => {
    const map = lookup("maps", m.mapId);
    const agent = lookup("agents", m.agentId);
    const kills = m.kills ?? 0;
    const deaths = m.deaths ?? 0;
    const ratio = deaths > 0 ? kills / deaths : kills;
    const ring = agentPrimary(agent?.name) ?? "var(--fg-faint)";
    const queue = QUEUE_KEYS.includes(m.queue) ? t(`companion.${m.queue}`) : m.queue;
    return <button className="wc-card" data-result={m.result} key={m.id} title={m.startedAt === null ? undefined : new Date(m.startedAt).toLocaleString(lang)} onClick={() => onSelect(m.id)}>
      <span className="wc-card-media" aria-hidden>
        {map?.art ? <span className="wc-card-art" style={{ backgroundImage: `url(${map.art})` }} /> : null}
        <span className="wc-card-scrim" />
      </span>
      <span className="wc-card-rail" aria-hidden />
      <AgentTile agent={agent} ring={ring} />
      <span className="wc-card-copy">
        <b className="wc-card-map">{map?.name ?? t("companion.unknown")}</b>
        <small className="wc-card-sub">{agent?.name ?? t("companion.unknown")} · {when(m.startedAt)}</small>
        <span className="wc-card-chips">
          <em className="wc-chip wc-chip-result">{t(`companion.${m.result}`)}</em>
          {queue ? <em className="wc-chip">{queue}</em> : null}
        </span>
      </span>
      <span className="wc-card-stats">
        <b className="wc-card-score">{m.score ?? "—"}</b>
        <small className="wc-card-kda">{display(m.kills)} / {display(m.deaths)} / {display(m.assists)}</small>
        <small className="wc-card-kd" data-good={ratio >= 1}>{ratio.toFixed(2)} K / D</small>
      </span>
    </button>;
  })}</div>;
  }

export default function Companion() {
  const { t, lang } = useI18n();
  const { route, navigate } = useRoute();
  const [revision, setRevision] = useState(0);
  const [authRevision, setAuthRevision] = useState(0);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [pairingOpen, setPairingOpen] = useState(false);
  const session = useResource<SessionData>("action=session", authRevision);
  const signedIn = session.data?.state === "authenticated" && !sessionBusy;
  const privateAccess = Boolean(signedIn && session.data?.privateDataEnabled);
  // `unavailable` means this deployment has no approved Riot client, so a
  // sign-in link would be a dead end. Everywhere else Riot sign-in is offered.
  const signInAvailable = Boolean(session.data) && session.data?.state !== "unavailable";
  // The pairing code is a one-time setup: once approved, this browser stays
  // connected until the player disconnects it from the site.
  const pairingAvailable = Boolean(session.data?.pairingAvailable);
  const phoneSession = session.data?.source === "phone";
  const query = `action=${route.section}&lang=${encodeURIComponent(lang)}`;
  const dashboard = useResource<DashboardData>(privateAccess && route.section === "dashboard" ? query : null, revision);
  const matches = useResource<MatchesData>(privateAccess && route.section === "matches" && !route.id ? `${query}&start=${route.start}&queue=${encodeURIComponent(route.queue)}` : null, revision);
  const match = useResource<MatchDetail>(privateAccess && route.section === "matches" && route.id ? `action=match&id=${encodeURIComponent(route.id)}` : null, revision);
  const agents = useResource<CatalogData>(privateAccess ? `action=catalog&kind=agents&lang=${encodeURIComponent(lang)}` : null);
  const maps = useResource<CatalogData>(privateAccess ? `action=catalog&kind=maps&lang=${encodeURIComponent(lang)}` : null);
  const tiers = useResource<TiersData>(privateAccess ? "action=tiers" : null, revision);
  const rankIcon = (tier: number | null | undefined) => tier == null ? null : tiers.data?.tiers.find(t => t.tier === tier)?.icon ?? null;
  // Riot reports a map as its "/Game/Maps/..." path and an agent as its
  // character uuid, so the catalog is keyed by path for maps and by uuid for
  // agents. The app's resolveMapName falls back to a suffix match, because
  // Riot sometimes hands back a partial path; the same fallback is used here.
  const lookup = (kind: "agents" | "maps", id: string) => {
    const items = (kind === "agents" ? agents : maps).data?.items;
    if (!items || !id) return undefined;
    const key = id.toLowerCase();
    const exact = items.find(i => i.id.toLowerCase() === key) ?? items.find(i => i.uuid?.toLowerCase() === key);
    if (exact) return exact;
    const loose = items.find(i => key.endsWith(i.id.toLowerCase()) || i.id.toLowerCase().endsWith(key));
    if (loose) return loose;
    const byUuid = items.find(i => i.uuid && (key.endsWith(i.uuid.toLowerCase()) || i.uuid.toLowerCase().endsWith(key)));
    return byUuid;
  };
  const name = (kind: "agents" | "maps", id: string) => lookup(kind, id)?.name ?? t("companion.unknown");
  const date = (value: number | string | null) => value === null ? "—" : new Date(value).toLocaleString(lang);
  const selected = route.section === "dashboard" ? dashboard : route.id ? match : matches;
  useEffect(() => {
    localStorage.removeItem("valsync_player_session");
    const timer = setInterval(() => { setAuthRevision(n => n + 1); if (session.data?.source === "phone") setRevision(n => n + 1); }, 60_000);
    return () => clearInterval(timer);
  }, [session.data?.source]);
  const expired = session.data?.state === "expired" || selected.error?.status === 401;
  async function sessionAction(action: "refresh" | "logout") {
    setSessionBusy(true); setSessionError(false);
    try {
      await mutateSession(action, session.data?.source);
      // Commit an authoritative session read before re-enabling private views.
      await getData<SessionData>("action=session");
      setAuthRevision(n => n + 1); setRevision(n => n + 1);
      if (action === "logout") window.location.reload();
    } catch { setSessionError(true); }
    finally { setSessionBusy(false); }
  }
  const filteredMatches = matches.data?.matches.filter(m => (!route.agent || m.agentId === route.agent) && (!route.map || m.mapId === route.map) && (!route.date || (m.startedAt !== null && new Date(m.startedAt).toLocaleDateString("en-CA") === route.date))) ?? [];
  const connectCopy = session.loading
    ? t("companion.loading")
    : expired
    ? t("companion.expired")
    : !session.data
    ? t("companion.privateUnavailable")
    : session.data.state === "unavailable"
    ? t("companion.pairLead")
    : session.data.privateDataEnabled
    ? t("companion.signinLead")
    : t("companion.privateUnavailable");

  return <main id="content" className="wc-app">
    <aside className="wc-sidebar"><div className="wc-brand"><span className="pip" aria-hidden /> VALSYNC <small>{t("companion.web")}</small></div><nav aria-label={t("companion.navigation")}>{sections.map((section, index) => { const Icon = icons[index]; return <a key={section} href={`?section=${section}`} aria-current={route.section === section ? "page" : undefined} onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); navigate({ section, id: "", start: 0 }); }}><Icon size={19} aria-hidden /><span>{t(`companion.${section}`)}</span></a>; })}</nav><p className="wc-sidebar-note">{t("companion.disclaimer")}</p></aside>
    <div className="wc-workspace">
      <header className="wc-toolbar"><div><p className="wc-eyebrow">{t("companion.web")}</p><h1>{t(`companion.${route.section}`)}</h1></div><div className="wc-actions"><LangSwitch /><button className="btn btn-ghost btn-sm" aria-label={t("companion.refresh")} disabled={selected.loading || sessionBusy} onClick={() => { setRevision(n => n + 1); setAuthRevision(n => n + 1); }}><RefreshCw size={16} aria-hidden /><span>{t("companion.refresh")}</span></button>{signedIn ? <button className="btn btn-ghost btn-sm" onClick={() => void sessionAction("logout")}><LogOut size={16} aria-hidden />{phoneSession ? t("companion.disconnect") : t("companion.logout")}</button> : null}</div></header>
      {pairingOpen && <PhonePairing onPaired={() => { setPairingOpen(false); setAuthRevision(n => n + 1); setRevision(n => n + 1); }} onClose={() => setPairingOpen(false)} />}
      {route.auth && <Notice text={t(`companion.auth_${["cancelled", "invalid", "failed", "unavailable"].includes(route.auth) ? route.auth : "failed"}`)} alert />}
      {sessionError && <Notice text={t("companion.sessionError")} alert />}
      {session.error && <Notice text={t("companion.backendUnavailable")} alert />}
      {!privateAccess && <section className="wc-panel wc-connect"><Crosshair size={40} aria-hidden /><h2>{t("companion.connectTitle")}</h2><p>{connectCopy}</p><div className="wc-actions">{signInAvailable && <a className="btn btn-primary" href={signInHref}><LogIn size={16} aria-hidden />{t("companion.signin")}</a>}{expired && session.data?.refreshable && <button className="btn btn-ghost" disabled={sessionBusy} onClick={() => void sessionAction("refresh")}>{t("companion.renew")}</button>}{pairingAvailable && <button className="btn btn-ghost" onClick={() => setPairingOpen(true)}>{t("companion.pairPhone")}</button>}</div></section>}
      {privateAccess && <>
        {session.data?.source === "phone" && <Notice text={t("companion.phoneData")} />}
        {selected.loading && <Notice text={t("companion.loading")} />}
        {selected.error && <Notice text={t(selected.error instanceof ApiError && selected.error.status === 429 ? "companion.rateLimited" : selected.error.status === 401 ? "companion.expired" : selected.error.code === "phone_sync_required" || selected.error.code === "phone_match_unavailable" ? "companion.phoneSyncRequired" : selected.error.status === 403 || selected.error.status === 503 ? "companion.privateUnavailable" : "companion.fetchError")} alert />}
        {selected.stale && <Notice text={t("companion.stale")} />}
        {route.section === "dashboard" && dashboard.data && <>
          <section className="wc-panel wc-profile"><div><p className="wc-eyebrow">{dashboard.data.profile.region.toUpperCase()}</p><h2>{dashboard.data.profile.name}<span className="wc-muted">#{dashboard.data.profile.tag}</span></h2></div><div className="wc-rank">{rankIcon(dashboard.data.profile.tier) && <img className="wc-rank-icon" src={rankIcon(dashboard.data.profile.tier)!} alt={t("companion.rankIcon")} width={72} height={72} referrerPolicy="no-referrer" />}<strong>{dashboard.data.profile.tier === null ? "—" : t(`companion.rank${Math.floor(dashboard.data.profile.tier / 3)}`)}{dashboard.data.profile.tier !== null && dashboard.data.profile.tier >= 3 && dashboard.data.profile.tier < 27 ? ` ${dashboard.data.profile.tier % 3 + 1}` : ""}</strong><span>{display(dashboard.data.profile.rr)} RR</span></div></section>
          <DashboardStats perf={dashboard.data.performance} t={t} date={date} />
          <h2 className="wc-section-title">{t("companion.recent")}</h2><MatchRows lookup={lookup} when={v => relativeDate(v, lang)} onSelect={id => navigate({ section: "matches", id })} rows={dashboard.data.matches} />{!dashboard.data.matches.length && <Notice text={t("companion.empty")} />}
        </>}
        {route.section === "matches" && !route.id && <>
          <div className="wc-filters"><label>{t("companion.queue")}<select value={route.queue} onChange={e => navigate({ queue: e.target.value, start: 0 })}>{["", "competitive", "unrated", "swiftplay", "spikerush", "deathmatch", "ggteam", "premier"].map(q => <option key={q} value={q}>{q ? t(`companion.${q}`) : t("companion.all")}</option>)}</select></label><label>{t("companion.agent")}<select value={route.agent} onChange={e => navigate({ agent: e.target.value })}><option value="">{t("companion.all")}</option>{agents.data?.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label>{t("companion.map")}<select value={route.map} onChange={e => navigate({ map: e.target.value })}><option value="">{t("companion.all")}</option>{maps.data?.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label>{t("companion.date")}<input type="date" value={route.date} onChange={e => navigate({ date: e.target.value })} /></label></div>
          <p className="wc-meta">{t("companion.pageFilters")}</p><MatchRows lookup={lookup} when={v => relativeDate(v, lang)} onSelect={id => navigate({ section: "matches", id })} rows={filteredMatches} />{matches.data && !filteredMatches.length && <Notice text={t("companion.empty")} />}<div className="wc-pagination"><button className="btn btn-ghost" disabled={route.start === 0 || matches.loading} onClick={() => navigate({ start: Math.max(0, route.start - 10) })}>{t("companion.previous")}</button><span className="wc-mono">{Math.floor(route.start / 10) + 1}</span><button className="btn btn-ghost" disabled={matches.data?.next == null || matches.loading} onClick={() => navigate({ start: matches.data?.next ?? 0 })}>{t("companion.next")}</button></div>
        </>}
        {route.section === "matches" && route.id && <><button className="btn btn-ghost" onClick={() => navigate({ id: "" })}>{t("companion.back")}</button>{match.data && <><MatchRows lookup={lookup} when={v => relativeDate(v, lang)} onSelect={id => navigate({ section: "matches", id })} rows={[match.data.match]} /><div className="wc-table-wrap"><table><caption>{t("companion.scoreboard")}</caption><thead><tr>{["player", "team", "agent", "kda", match.data.players.some(p => p.ps != null) ? "ps" : "acs"].map(k => <th key={k} scope="col">{t(`companion.${k}`)}</th>)}</tr></thead><tbody>{match.data.players.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.team}</td><td>{name("agents", p.agentId)}</td><td className="wc-mono">{display(p.kills)} / {display(p.deaths)} / {display(p.assists)}</td><td className="wc-mono">{match.data!.players.some(q => q.ps != null) ? display(p.ps) : display(p.acs)}</td></tr>)}</tbody></table></div><h2 className="wc-section-title">{t("companion.rounds")}</h2><div className="wc-rounds">{match.data.rounds.map(r => <div className="wc-panel" key={r.number}><strong>{r.number.toString().padStart(2, "0")}</strong><span>{r.winner} · {r.reason}</span></div>)}</div>{!match.data.rounds.length && <Notice text={t("companion.roundsUnavailable")} />}</>}</>}
        {selected.data && <p className="wc-meta">{t(session.data?.source === "phone" ? "companion.phoneUpdated" : "companion.updated")} {date(selected.data.fetchedAt)}</p>}
      </>}
      <footer className="wc-footnote"><p>{t("companion.disclaimer")}</p><a href={COMPANION_CANONICAL_URL}>{t("companion.canonical")}</a></footer>
    </div>
  </main>;
}
