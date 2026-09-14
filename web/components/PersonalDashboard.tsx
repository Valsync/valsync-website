"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Crosshair,
  LogOut,
  ShieldCheck,
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
  const rankLower = profile.rank.toLowerCase();
  const isHighTier =
    rankLower.startsWith("immortal") || rankLower === "radiant";
  const progressLabel = isHighTier
    ? `${profile.rr} RR · ${profile.rank}`
    : `${profile.rrToNext} RR to ${nextRank}`;
  const progressWidth = isHighTier
    ? 100
    : Math.min(100, Math.max(0, profile.rr));

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
              aria-label={
                isHighTier
                  ? `${profile.rr} RR · ${profile.rank}`
                  : `${profile.rrToNext} RR to ${nextRank}`
              }
            >
              <span
                style={{
                  width: `${progressWidth}%`,
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

        <a href="#matches" className="personal-link">
          Open match history <ArrowUpRight size={15} />
        </a>
      </div>
    </section>
  );
}
