"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  Crosshair,
  LogOut,
  ShieldCheck,
  Trophy,
  Zap,
} from "lucide-react";
import {
  beginRiotSignIn,
  getNextRank,
  getRankColor,
  signOut,
  usePersonalStats,
} from "@/lib/personal-stats";
import BracketLabel from "./hud/BracketLabel";
import Panel from "./hud/Panel";
import SectionHead from "./hud/SectionHead";
import RiotConnectModal from "./RiotConnectModal";
import { riseItem, staggerParent, tapSpring, viewportOnce } from "./hud/motion";

export default function PersonalDashboard() {
  const { status, data, isLive } = usePersonalStats();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // If not signed in with a Riot account, hide the stats completely and show the tactical connect prompt
  if (!isLive || !data) {
    return (
      <section className="section" id="dashboard">
        <div className="container">
          <SectionHead
            eyebrow="Your command center"
            title="Every readout is yours."
            lead="A private, account-first view of the games you played, the agents you trust, and the habits that move your rank."
            note="Private telemetry · Riot sign-in required"
            tone="cyan"
          />

          <Panel
            className="profile-connect"
            accent="cyan"
            fill="deep"
            grid
            scanlines
            brackets
          >
            <div className="profile-connect-head">
              <div className="profile-avatar" aria-hidden>
                <Crosshair size={28} />
              </div>
              <div>
                <BracketLabel tone="cyan">Private session</BracketLabel>
                <h3 className="profile-name">Tactical Dashboard Locked</h3>
                <p className="t-mono">Authentication required to decrypt stats</p>
              </div>
            </div>

            <div className="profile-connect-body">
              <p className="t-lead">
                Sign in with your Riot account to display only your own rank, recent competitive matches, and agent tendencies. No public profile scraping or third-party ads.
              </p>

              <div className="profile-connect-actions">
                <motion.button
                  type="button"
                  className="btn btn-primary"
                  onClick={beginRiotSignIn}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={tapSpring}
                >
                  <Zap size={16} /> Sign in with Riot Games
                </motion.button>

                <motion.button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setIsModalOpen(true)}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={tapSpring}
                >
                  <Crosshair size={16} /> Connect via Riot ID
                </motion.button>
              </div>

              <div className="profile-connect-trust t-mono">
                <ShieldCheck size={14} />
                <span>Zero ads · Encrypted session handoff · Direct Riot PVP API telemetry</span>
              </div>
            </div>
          </Panel>

          <RiotConnectModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </section>
    );
  }

  const { profile } = data;
  const rankColor = getRankColor(profile.rank);
  const nextRank = getNextRank(profile.rank);
  const isRadiant = profile.rank.toLowerCase() === "radiant";
  const progressLabel = isRadiant
    ? "Top ladder · Radiant"
    : `${profile.rrToNext} RR to ${nextRank}`;

  // Dynamic tactical insights computed from the live competitive match queue
  const wins = data.matches.filter((m) => m.result === "Victory").length;
  const totalMatches = data.matches.length;
  const formTitle =
    totalMatches > 0 && wins >= totalMatches / 2 ? "Form is rising" : "Recent form";
  const formDetail =
    totalMatches > 0
      ? `${wins} wins from your last ${totalMatches} competitive games`
      : "Calibrating recent queue form";

  const mapStats = new Map<string, { wins: number; total: number }>();
  for (const m of data.matches) {
    const cur = mapStats.get(m.map) ?? { wins: 0, total: 0 };
    cur.total += 1;
    if (m.result === "Victory") cur.wins += 1;
    mapStats.set(m.map, cur);
  }
  let bestMap = "Sunset";
  let bestMapRate = 68;
  let bestMapMatches = 19;
  if (mapStats.size > 0) {
    let topEntry: [string, { wins: number; total: number }] | null = null;
    for (const entry of mapStats.entries()) {
      if (!topEntry || entry[1].wins > topEntry[1].wins) {
        topEntry = entry;
      }
    }
    if (topEntry) {
      bestMap = topEntry[0];
      bestMapRate = Math.round((topEntry[1].wins / topEntry[1].total) * 100);
      bestMapMatches = topEntry[1].total;
    }
  }

  const topAgent = data.agents[0] ?? {
    agent: "Omen",
    winRate: 63,
    played: 24,
    acs: 228,
  };

  const totalAgentGames = data.agents.reduce((acc, a) => acc + a.played, 0);
  const agentQueueLabel =
    totalAgentGames > 0
      ? `LAST ${totalAgentGames} COMPETITIVE MATCHES`
      : "RECENT COMPETITIVE QUEUE";

  return (
    <section className="section" id="dashboard">
      <div className="container">
        <div className="dashboard-head-row">
          <SectionHead
            eyebrow="Your command center"
            title="Every readout is yours."
            lead="A private, account-first view of the games you played, the agents you trust, and the habits that move your rank."
            tone="cyan"
          />

          <div className="live-sync-badge">
            <span className="live-pulse" aria-hidden />
            <span className="t-mono text-xs">
              {data.authMethod === "rso" ? "Riot SSO Session" : "Riot ID Linked"} ·{" "}
              <b>
                {profile.name}
                {profile.tag}
              </b>
            </span>
            <button
              type="button"
              className="live-disconnect-btn"
              onClick={signOut}
              title="Sign out of Riot session"
            >
              <LogOut size={13} /> Disconnect
            </button>
          </div>
        </div>

        <motion.div
          className="profile-grid"
          variants={staggerParent(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <Panel
            className="profile-card"
            accent="cyan"
            fill="deep"
            grid
            scanlines
            brackets
            variants={riseItem}
          >
            <div className="profile-card-head">
              <div
                className="profile-avatar"
                style={{
                  color: rankColor,
                  borderColor: rankColor,
                  background: `color-mix(in srgb, ${rankColor} 12%, transparent)`,
                }}
                aria-hidden
              >
                <Crosshair size={28} />
              </div>
              <div>
                <BracketLabel tone="cyan">
                  {data.authMethod === "rso" ? "Riot SSO Profile" : "Personal profile"}
                </BracketLabel>
                <h3 className="profile-name">{profile.name}</h3>
                <p className="t-mono">
                  {profile.tag} · {profile.region} · {profile.lastSync}
                </p>
              </div>
            </div>
            <div className="rank-readout">
              <div>
                <span className="t-micro">Current rank</span>
                <strong style={{ color: rankColor }}>{profile.rank}</strong>
                <span className="t-mono">{profile.season}</span>
              </div>
              <div className="rr-value">
                <b>{profile.rr}</b>
                <span>RR</span>
              </div>
            </div>
            <div
              className="rr-progress"
              aria-label={`${profile.rrToNext} RR to next rank`}
            >
              <span
                style={{
                  width: `${profile.rr}%`,
                  background: rankColor,
                  boxShadow: `0 0 18px color-mix(in srgb, ${rankColor} 70%, transparent)`,
                }}
              />
            </div>
            <p className="t-mono profile-progress-copy">{progressLabel}</p>
          </Panel>

          <div className="personal-stat-grid">
            {data.stats.map((stat) => (
              <motion.div
                className="personal-stat"
                key={stat.label}
                variants={riseItem}
                data-tone={stat.tone}
              >
                <span className="t-micro">{stat.label}</span>
                <strong>{stat.value}</strong>
                <span>{stat.detail}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="insight-strip"
          variants={staggerParent(0.09)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          <motion.div variants={riseItem}>
            <Activity size={18} />
            <span>
              <b>{formTitle}</b>
              <small>{formDetail}</small>
            </span>
          </motion.div>
          <motion.div variants={riseItem}>
            <Trophy size={18} />
            <span>
              <b>Best map: {bestMap}</b>
              <small>
                {bestMapRate}% win rate across {bestMapMatches} matches
              </small>
            </span>
          </motion.div>
          <motion.div variants={riseItem}>
            <ShieldCheck size={18} />
            <span>
              <b>Reliable pick: {topAgent.agent}</b>
              <small>
                {topAgent.winRate}% win rate across {topAgent.played} matches
              </small>
            </span>
          </motion.div>
        </motion.div>

        <div className="personal-section-head">
          <div>
            <BracketLabel tone="red">Agent pool</BracketLabel>
            <h3 className="t-display">Your reliable picks</h3>
          </div>
          <span className="t-mono">{agentQueueLabel}</span>
        </div>

        <motion.div
          className="agent-grid"
          variants={staggerParent(0.08)}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
        >
          {data.agents.map((item) => (
            <Panel
              className="agent-card"
              accent="neutral"
              fill="low"
              variants={riseItem}
              key={item.agent}
            >
              <span className="agent-initial" aria-hidden>
                {item.agent.slice(0, 1)}
              </span>
              <div>
                <h4>{item.agent}</h4>
                <span className="t-mono">{item.played} matches played</span>
              </div>
              <div className="agent-stats">
                <b>{item.winRate}%</b>
                <span>WIN RATE</span>
                <b>{item.acs}</b>
                <span>ACS</span>
              </div>
            </Panel>
          ))}
        </motion.div>

        <a href="#matches" className="personal-link">
          Open match history <ArrowUpRight size={15} />
        </a>
      </div>
    </section>
  );
}
