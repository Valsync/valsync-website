"use client";
import { useEffect, useState } from "react";
import { Activity, BookOpen, Crosshair, LayoutDashboard, LogOut, RefreshCw, ShoppingBag } from "lucide-react";
import { ApiError, COMPANION_CANONICAL_URL, getData, mutateSession, useResource } from "@/lib/companion";
import type { CatalogData, CatalogItem, CatalogKind, DashboardData, MatchDetail, MatchesData, MatchSummary, SessionData, StatusData, StoreData } from "@/lib/companion-types";
import { useI18n } from "@/lib/i18n";
import LangSwitch from "./LangSwitch";
import PhonePairing from "./PhonePairing";
import "./companion.css";

const sections = ["dashboard", "matches", "store", "wiki", "status"] as const;
type Section = typeof sections[number];
const icons = [LayoutDashboard, Crosshair, ShoppingBag, BookOpen, Activity];
type Route = { section: Section; id: string; kind: CatalogKind; start: number; queue: string; agent: string; map: string; date: string; auth: string };
const initial: Route = { section: "dashboard", id: "", kind: "agents", start: 0, queue: "competitive", agent: "", map: "", date: "", auth: "" };
function readRoute(): Route {
  const q = new URLSearchParams(window.location.search);
  return { section: sections.includes(q.get("section") as Section) ? q.get("section") as Section : "dashboard", id: q.get("id") ?? "", kind: ["agents", "weapons", "maps", "skins"].includes(q.get("kind") ?? "") ? q.get("kind") as CatalogKind : "agents", start: Math.max(0, Math.min(1000, Number(q.get("start")) || 0)), queue: q.get("queue") ?? "competitive", agent: q.get("agent") ?? "", map: q.get("map") ?? "", date: q.get("date") ?? "", auth: q.get("auth") ?? "" };
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
function useClock() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer); }, []);
  return now;
}
function countdown(expiry: number | null, now: number | null) {
  if (expiry === null || now === null) return "—";
  const seconds = Math.max(0, Math.floor((expiry - now) / 1000));
  return `${Math.floor(seconds / 3600).toString().padStart(2, "0")}:${Math.floor(seconds / 60 % 60).toString().padStart(2, "0")}:${(seconds % 60).toString().padStart(2, "0")}`;
}
const display = (value: number | null | undefined) => value == null ? "—" : Number.isInteger(value) ? String(value) : value.toFixed(2);
function Notice({ text, alert = false }: { text: string; alert?: boolean }) { return <p className="wc-notice" role={alert ? "alert" : "status"}>{text}</p>; }
function Picture({ item, eager = false }: { item: { name: string; image: string | null }; eager?: boolean }) {
  const [loaded, setLoaded] = useState<string | null>(null);
  return <div className="wc-media" data-loaded={item.image !== null && loaded === item.image}>
    <Crosshair className="wc-placeholder" size={40} aria-hidden />
    {item.image && <img src={item.image} alt={item.name} loading={eager ? "eager" : "lazy"} referrerPolicy="no-referrer" onLoad={() => setLoaded(item.image)} />}
  </div>;
}

function MatchRows({ rows, name, date, onSelect }: { rows: MatchSummary[]; name: (kind: "agents" | "maps", id: string) => string; date: (value: number | null) => string; onSelect: (id: string) => void }) {
  const { t } = useI18n();
    return <div className="wc-match-list">{rows.map(m => <button className="wc-match" key={m.id} onClick={() => onSelect(m.id)}>
      <span className={`wc-result wc-${m.result}`}>{t(`companion.${m.result}`)}</span><span><strong>{name("maps", m.mapId)}</strong><small>{name("agents", m.agentId)} · {m.queue}</small></span><span className="wc-mono">{m.score ?? "—"}<small>{display(m.kills)} / {display(m.deaths)} / {display(m.assists)}</small></span><small>{date(m.startedAt)}</small>
    </button>)}</div>;
  }

export default function Companion() {
  const { t, lang } = useI18n();
  const { route, navigate } = useRoute();
  const [revision, setRevision] = useState(0);
  const [authRevision, setAuthRevision] = useState(0);
  const [sessionBusy, setSessionBusy] = useState(false);
  const [sessionError, setSessionError] = useState(false);
  const [search, setSearch] = useState("");
  const [pairingOpen, setPairingOpen] = useState(false);
  const now = useClock();
  const session = useResource<SessionData>("action=session", authRevision);
  const signedIn = session.data?.state === "authenticated" && !sessionBusy;
  const privateAccess = signedIn && session.data?.privateDataEnabled;
  const query = `action=${route.section}&lang=${encodeURIComponent(lang)}`;
  const dashboard = useResource<DashboardData>(privateAccess && route.section === "dashboard" ? query : null, revision);
  const matches = useResource<MatchesData>(privateAccess && route.section === "matches" && !route.id ? `${query}&start=${route.start}&queue=${encodeURIComponent(route.queue)}` : null, revision);
  const match = useResource<MatchDetail>(privateAccess && route.section === "matches" && route.id ? `action=match&id=${encodeURIComponent(route.id)}` : null, revision);
  const store = useResource<StoreData>(privateAccess && route.section === "store" ? query : null, revision);
  const wiki = useResource<CatalogData>(route.section === "wiki" ? `action=catalog&kind=${route.kind}&lang=${encodeURIComponent(lang)}` : null, revision);
  const status = useResource<StatusData>(route.section === "status" ? query : null, revision);
  const needNames = route.section === "dashboard" || route.section === "matches";
  const agents = useResource<CatalogData>(needNames ? `action=catalog&kind=agents&lang=${encodeURIComponent(lang)}` : null);
  const maps = useResource<CatalogData>(needNames ? `action=catalog&kind=maps&lang=${encodeURIComponent(lang)}` : null);
  const name = (kind: "agents" | "maps", id: string) => (kind === "agents" ? agents : maps).data?.items.find(i => i.id.toLowerCase() === id.toLowerCase())?.name ?? t("companion.unknown");
  const date = (value: number | string | null) => value === null ? "—" : new Date(value).toLocaleString(lang);
  const selected = route.section === "dashboard" ? dashboard : route.section === "matches" ? route.id ? match : matches : route.section === "store" ? store : route.section === "wiki" ? wiki : status;
  const publicSection = route.section === "wiki" || route.section === "status";
  const canRender = publicSection || privateAccess;
  useEffect(() => {
    localStorage.removeItem("valsync_player_session");
    const timer = setInterval(() => { setAuthRevision(n => n + 1); if (session.data?.source === "phone" || route.section === "status") setRevision(n => n + 1); }, 60_000);
    return () => clearInterval(timer);
  }, [session.data?.source, route.section]);
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
  const wikiItems = wiki.data?.items.filter(i => `${i.name} ${i.description}`.toLocaleLowerCase(lang).includes(search.toLocaleLowerCase(lang))) ?? [];
  const detail: CatalogItem | undefined = wiki.data?.items.find(i => i.id === route.id);

  return <main id="content" className="wc-app">
    <aside className="wc-sidebar"><div className="wc-brand"><span className="pip" aria-hidden /> VALSYNC <small>{t("companion.web")}</small></div><nav aria-label={t("companion.navigation")}>{sections.map((section, index) => { const Icon = icons[index]; return <a key={section} href={`?section=${section}`} aria-current={route.section === section ? "page" : undefined} onClick={e => { if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return; e.preventDefault(); navigate({ section, id: "", start: 0 }); }}><Icon size={19} aria-hidden /><span>{t(`companion.${section}`)}</span></a>; })}</nav><p className="wc-sidebar-note">{t("companion.disclaimer")}</p></aside>
    <div className="wc-workspace">
      <header className="wc-toolbar"><div><p className="wc-eyebrow">{t("companion.web")}</p><h1>{t(`companion.${route.section}`)}</h1></div><div className="wc-actions"><LangSwitch /><button className="btn btn-ghost btn-sm" aria-label={t("companion.refresh")} disabled={selected.loading || sessionBusy} onClick={() => { setRevision(n => n + 1); setAuthRevision(n => n + 1); }}><RefreshCw size={16} aria-hidden /><span>{t("companion.refresh")}</span></button>{signedIn ? <button className="btn btn-ghost btn-sm" onClick={() => void sessionAction("logout")}><LogOut size={16} aria-hidden />{t("companion.logout")}</button> : session.data?.pairingAvailable ? <button className="btn btn-primary btn-sm" onClick={() => setPairingOpen(true)}>{t("companion.pairPhone")}</button> : <a className={`btn btn-primary btn-sm ${session.data?.state === "unavailable" || !session.data ? "wc-disabled" : ""}`} aria-disabled={session.data?.state === "unavailable" || !session.data} href={session.data && session.data.state !== "unavailable" ? "/.netlify/functions/riot-auth-start" : undefined}>{t("companion.signin")}</a>}</div></header>
      {pairingOpen && <PhonePairing onPaired={() => { setPairingOpen(false); setAuthRevision(n => n + 1); setRevision(n => n + 1); }} onClose={() => setPairingOpen(false)} />}
      {route.auth && <Notice text={t(`companion.auth_${["cancelled", "invalid", "failed", "unavailable"].includes(route.auth) ? route.auth : "failed"}`)} alert />}
      {sessionError && <Notice text={t("companion.sessionError")} alert />}
      {session.error && <Notice text={t("companion.backendUnavailable")} alert />}
      {!publicSection && !privateAccess && <section className="wc-panel wc-connect"><Crosshair size={40} aria-hidden /><h2>{t("companion.connectTitle")}</h2><p>{session.loading ? t("companion.loading") : expired ? t("companion.expired") : session.data?.state === "anonymous" ? t("companion.connectBody") : session.data?.pairingAvailable ? t("companion.phoneConnect") : t("companion.privateUnavailable")}</p>{expired && session.data?.refreshable && <button className="btn btn-primary" disabled={sessionBusy} onClick={() => void sessionAction("refresh")}>{t("companion.renew")}</button>}<a className="btn btn-ghost" href="?section=wiki" onClick={e => { e.preventDefault(); navigate({ section: "wiki", id: "" }); }}>{t("companion.browseWiki")}</a></section>}
      {canRender && <>
        {!publicSection && session.data?.source === "phone" && <Notice text={t("companion.phoneData")} />}
        {selected.loading && <Notice text={t("companion.loading")} />}
        {selected.error && <Notice text={t(selected.error instanceof ApiError && selected.error.status === 429 ? "companion.rateLimited" : selected.error.status === 401 ? "companion.expired" : selected.error.code === "phone_sync_required" || selected.error.code === "phone_match_unavailable" ? "companion.phoneSyncRequired" : selected.error.status === 403 || selected.error.status === 503 ? "companion.privateUnavailable" : "companion.fetchError")} alert />}
        {selected.stale && <Notice text={t("companion.stale")} />}
        {route.section === "dashboard" && dashboard.data && <>
          <section className="wc-panel wc-profile"><div><p className="wc-eyebrow">{dashboard.data.profile.region.toUpperCase()}</p><h2>{dashboard.data.profile.name}<span className="wc-muted">#{dashboard.data.profile.tag}</span></h2></div><div className="wc-rank"><strong>{dashboard.data.profile.tier === null ? "—" : t(`companion.rank${Math.floor(dashboard.data.profile.tier / 3)}`)}{dashboard.data.profile.tier !== null && dashboard.data.profile.tier >= 3 && dashboard.data.profile.tier < 27 ? ` ${dashboard.data.profile.tier % 3 + 1}` : ""}</strong><span>{display(dashboard.data.profile.rr)} RR</span></div></section>
          <p className="wc-meta">{t("companion.sample")} · {dashboard.data.performance.sampleSize} · {date(dashboard.data.performance.from)} — {date(dashboard.data.performance.to)}</p>
          <div className="wc-stats">{[[t("companion.winRate"), dashboard.data.performance.sampleSize ? `${Math.round(dashboard.data.performance.wins / dashboard.data.performance.sampleSize * 100)}%` : "—"], ["K / D", display(dashboard.data.performance.kd)], ["ACS", display(dashboard.data.performance.acs)], [t("companion.played"), String(dashboard.data.performance.sampleSize)]].map(([label, value]) => <div className="wc-panel" key={label}><p className="wc-eyebrow">{label}</p><strong className="wc-value">{value}</strong></div>)}</div>
          <h2 className="wc-section-title">{t("companion.recent")}</h2><MatchRows name={name} date={date} onSelect={id => navigate({ section: "matches", id })} rows={dashboard.data.matches} />{!dashboard.data.matches.length && <Notice text={t("companion.empty")} />}
        </>}
        {route.section === "matches" && !route.id && <>
          <div className="wc-filters"><label>{t("companion.queue")}<select value={route.queue} onChange={e => navigate({ queue: e.target.value, start: 0 })}>{["", "competitive", "unrated", "swiftplay", "spikerush", "deathmatch", "ggteam", "premier"].map(q => <option key={q} value={q}>{q ? t(`companion.${q}`) : t("companion.all")}</option>)}</select></label><label>{t("companion.agent")}<select value={route.agent} onChange={e => navigate({ agent: e.target.value })}><option value="">{t("companion.all")}</option>{agents.data?.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label>{t("companion.map")}<select value={route.map} onChange={e => navigate({ map: e.target.value })}><option value="">{t("companion.all")}</option>{maps.data?.items.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label><label>{t("companion.date")}<input type="date" value={route.date} onChange={e => navigate({ date: e.target.value })} /></label></div>
          <p className="wc-meta">{t("companion.pageFilters")}</p><MatchRows name={name} date={date} onSelect={id => navigate({ section: "matches", id })} rows={filteredMatches} />{matches.data && !filteredMatches.length && <Notice text={t("companion.empty")} />}<div className="wc-pagination"><button className="btn btn-ghost" disabled={route.start === 0 || matches.loading} onClick={() => navigate({ start: Math.max(0, route.start - 10) })}>{t("companion.previous")}</button><span className="wc-mono">{Math.floor(route.start / 10) + 1}</span><button className="btn btn-ghost" disabled={matches.data?.next == null || matches.loading} onClick={() => navigate({ start: matches.data?.next ?? 0 })}>{t("companion.next")}</button></div>
        </>}
        {route.section === "matches" && route.id && <><button className="btn btn-ghost" onClick={() => navigate({ id: "" })}>{t("companion.back")}</button>{match.data && <><MatchRows name={name} date={date} onSelect={id => navigate({ section: "matches", id })} rows={[match.data.match]} /><div className="wc-table-wrap"><table><caption>{t("companion.scoreboard")}</caption><thead><tr>{["player", "team", "agent", "kda", "acs"].map(k => <th key={k} scope="col">{t(`companion.${k}`)}</th>)}</tr></thead><tbody>{match.data.players.map(p => <tr key={p.id}><td>{p.name}</td><td>{p.team}</td><td>{name("agents", p.agentId)}</td><td className="wc-mono">{display(p.kills)} / {display(p.deaths)} / {display(p.assists)}</td><td className="wc-mono">{display(p.acs)}</td></tr>)}</tbody></table></div><h2 className="wc-section-title">{t("companion.rounds")}</h2><div className="wc-rounds">{match.data.rounds.map(r => <div className="wc-panel" key={r.number}><strong>{r.number.toString().padStart(2, "0")}</strong><span>{r.winner} · {r.reason}</span></div>)}</div>{!match.data.rounds.length && <Notice text={t("companion.roundsUnavailable")} />}</>}</>}
        {route.section === "store" && store.data && <><div className="wc-section-head"><h2>{t("companion.daily")}</h2><p className="wc-mono">{t("companion.resets")} {countdown(store.data.expiresAt, now)}</p></div>{store.data.expiresAt !== null && now !== null && store.data.expiresAt <= now && <Notice text={t("companion.storeExpired")} />}<div className="wc-catalog">{store.data.daily.map(o => <article className="wc-panel wc-offer" key={o.id}><Picture item={o} eager /><h3>{o.name}</h3><p className="wc-mono">{display(o.vp)} VP</p></article>)}</div>{!store.data.daily.length && <Notice text={t("companion.empty")} />}<div className="wc-section-head"><h2>{t("companion.nightMarket")}</h2><p className="wc-mono">{countdown(store.data.nightExpiresAt, now)}</p></div><div className="wc-catalog">{store.data.nightMarket.map(o => <article className="wc-panel wc-offer" key={o.id}><Picture item={o} eager /><h3>{o.name}</h3><p className="wc-mono">{o.originalVp !== null && <del>{o.originalVp} VP</del>} {display(o.vp)} VP {o.discount !== null && <span className="wc-win">−{o.discount}%</span>}</p></article>)}</div>{!store.data.nightMarket.length && <Notice text={t("companion.nightInactive")} />}</>}
        {route.section === "wiki" && <><div className="wc-filters"><label>{t("companion.category")}<select value={route.kind} onChange={e => { setSearch(""); navigate({ kind: e.target.value as CatalogKind, id: "" }); }}>{["agents", "weapons", "maps", "skins"].map(k => <option key={k} value={k}>{t(`companion.${k}`)}</option>)}</select></label><label className="wc-search">{t("companion.search")}<input type="search" value={search} onChange={e => { setSearch(e.target.value); if (route.id) navigate({ id: "" }); }} placeholder={t("companion.search")} /></label></div>{route.id ? <><button className="btn btn-ghost" onClick={() => navigate({ id: "" })}>{t("companion.back")}</button>{detail ? <article className="wc-panel wc-detail"><Picture item={detail} eager /><h2>{detail.name}</h2><p>{detail.description}</p>{detail.facts.map(f => <p key={f}>{f}</p>)}</article> : wiki.data && <Notice text={t("companion.empty")} />}</> : <><div className="wc-catalog">{wikiItems.map((i, index) => <button className="wc-panel wc-wiki-card" key={i.id} onClick={() => navigate({ id: i.id })}><Picture item={i} eager={index < 8} /><h2>{i.name}</h2><span>{t("companion.details")}</span></button>)}</div>{wiki.data && !wikiItems.length && <Notice text={t("companion.empty")} />}</>}</>}
        {route.section === "status" && status.data && <div className="wc-status-grid">{status.data.regions.map(r => <section className="wc-panel" key={r.id}><div className="wc-section-head"><h2>{r.id.toUpperCase()}</h2><span className={r.state === "operational" ? "wc-win" : "wc-muted"}>{t(`companion.${r.state}`)}</span></div>{r.items.map(i => <article key={i.id}><h3>{i.title}</h3><p>{i.description}</p>{i.updatedAt && <small>{date(i.updatedAt)}</small>}</article>)}</section>)}</div>}
        {selected.data && <p className="wc-meta">{t(!publicSection && session.data?.source === "phone" ? "companion.phoneUpdated" : "companion.updated")} {date(selected.data.fetchedAt)}</p>}
      </>}
      <footer className="wc-footnote"><p>{t("companion.disclaimer")}</p><a href={COMPANION_CANONICAL_URL}>{t("companion.canonical")}</a></footer>
    </div>
  </main>;
}
