"use client";

import { motion } from "framer-motion";
import { Activity, ArrowUpRight, Crosshair, ShieldCheck, Trophy } from "lucide-react";
import { beginRiotSignIn, usePersonalStats } from "@/lib/personal-stats";
import BracketLabel from "./hud/BracketLabel";
import Panel from "./hud/Panel";
import SectionHead from "./hud/SectionHead";
import { riseItem, staggerParent, viewportOnce } from "./hud/motion";

export default function PersonalDashboard() {
  const { status, data } = usePersonalStats();

  if (status !== "ready" || !data) {
    return (
      <section className="section" id="dashboard">
        <div className="container">
          <Panel className="profile-connect" accent="cyan" fill="deep" grid scanlines brackets>
            <BracketLabel tone="cyan">Private player data</BracketLabel>
            <h2 className="t-display">{status === "loading" ? "Checking your secure session…" : "Link your Riot account."}</h2>
            <p className="t-lead">{status === "loading" ? "Your VALSYNC dashboard will appear here when the session is ready." : "Sign in to display only your own rank, recent competitive matches, and agent performance."}</p>
            {status !== "loading" && <button className="btn btn-primary" onClick={beginRiotSignIn}>Sign in with Riot</button>}
          </Panel>
        </div>
      </section>
    );
  }
  const { profile } = data;

  return (
    <section className="section" id="dashboard">
      <div className="container">
        <SectionHead
          eyebrow="Your command center"
          title="Every readout is yours."
          lead="A private, account-first view of the games you played, the agents you trust, and the habits that move your rank."
          note="Demo profile · Connect Riot in the app to sync"
          tone="cyan"
        />

        <motion.div className="profile-grid" variants={staggerParent(0.08)} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <Panel className="profile-card" accent="cyan" fill="deep" grid scanlines brackets variants={riseItem}>
            <div className="profile-card-head">
              <div className="profile-avatar" aria-hidden><Crosshair size={28} /></div>
              <div>
                <BracketLabel tone="cyan">Personal profile</BracketLabel>
                <h3 className="profile-name">{profile.name}</h3>
                <p className="t-mono">{profile.tag} · {profile.region} · {profile.lastSync}</p>
              </div>
            </div>
            <div className="rank-readout">
              <div>
                <span className="t-micro">Current rank</span>
                <strong>{profile.rank}</strong>
                <span className="t-mono">{profile.season}</span>
              </div>
              <div className="rr-value"><b>{profile.rr}</b><span>RR</span></div>
            </div>
            <div className="rr-progress" aria-label={`${profile.rrToNext} RR to next rank`}>
              <span style={{ width: `${profile.rr}%` }} />
            </div>
            <p className="t-mono profile-progress-copy">{profile.rrToNext} RR to Ascendant 3</p>
          </Panel>

          <div className="personal-stat-grid">
            {data.stats.map((stat) => (
              <motion.div className="personal-stat" key={stat.label} variants={riseItem} data-tone={stat.tone}>
                <span className="t-micro">{stat.label}</span>
                <strong>{stat.value}</strong>
                <span>{stat.detail}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div className="insight-strip" variants={staggerParent(0.09)} initial="hidden" whileInView="show" viewport={viewportOnce}>
          <motion.div variants={riseItem}><Activity size={18} /><span><b>Form is rising</b><small>7 wins from your last 10 competitive games</small></span></motion.div>
          <motion.div variants={riseItem}><Trophy size={18} /><span><b>Best map: Sunset</b><small>68% win rate across 19 matches</small></span></motion.div>
          <motion.div variants={riseItem}><ShieldCheck size={18} /><span><b>Clutch conversion</b><small>Won 6 of your last 11 1v1 situations</small></span></motion.div>
        </motion.div>

        <div className="personal-section-head">
          <div><BracketLabel tone="red">Agent pool</BracketLabel><h3 className="t-display">Your reliable picks</h3></div>
          <span className="t-mono">LAST 54 COMPETITIVE MATCHES</span>
        </div>
        <motion.div className="agent-grid" variants={staggerParent(0.08)} initial="hidden" whileInView="show" viewport={viewportOnce}>
          {data.agents.map((item) => (
            <Panel className="agent-card" accent="neutral" fill="low" variants={riseItem} key={item.agent}>
              <span className="agent-initial" aria-hidden>{item.agent.slice(0, 1)}</span>
              <div><h4>{item.agent}</h4><span className="t-mono">{item.played} matches played</span></div>
              <div className="agent-stats"><b>{item.winRate}%</b><span>WIN RATE</span><b>{item.acs}</b><span>ACS</span></div>
            </Panel>
          ))}
        </motion.div>
        <a href="#matches" className="personal-link">Open match history <ArrowUpRight size={15} /></a>
      </div>
    </section>
  );
}
