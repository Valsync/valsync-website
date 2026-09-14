"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crosshair, ShieldCheck, X, Zap } from "lucide-react";
import {
  beginRiotSignIn,
  connectWithRiotId,
  VALORANT_RANKS,
} from "@/lib/personal-stats";
import { REGIONS, type Region } from "@/lib/mock";
import BracketLabel from "./hud/BracketLabel";
import Panel from "./hud/Panel";
import { tapSpring } from "./hud/motion";

export default function RiotConnectModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [region, setRegion] = useState<Region>("EU");
  const [rank, setRank] = useState("Ascendant 2");
  const [rr, setRr] = useState("74");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter your Riot Game Name");
      return;
    }

    const cleanTag = tag.trim().replace(/^#/, "");
    if (!cleanTag) {
      setError("Please enter your tagline (e.g. NA1 or 0001)");
      return;
    }

    connectWithRiotId({
      name: cleanName,
      tag: cleanTag,
      region,
      rank,
      rr: parseInt(rr, 10) || 50,
    });

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="riot-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
          <motion.div
            className="riot-modal-container"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <Panel
              className="riot-modal-panel"
              accent="cyan"
              fill="deep"
              grid
              scanlines
              brackets
            >
              <div className="riot-modal-head">
                <div className="riot-modal-title-group">
                  <BracketLabel tone="cyan">Tactical Session</BracketLabel>
                  <h3 className="riot-modal-title">Link Riot Account</h3>
                </div>
                <button
                  type="button"
                  className="riot-modal-close"
                  onClick={onClose}
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="riot-rso-banner">
                <div className="riot-rso-info">
                  <div className="riot-rso-badge">
                    <Zap size={14} /> Official Riot Sign-On
                  </div>
                  <p className="t-mono text-xs text-muted">
                    Authenticate directly through Riot Games SSO for live session sync.
                  </p>
                </div>
                <motion.button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={beginRiotSignIn}
                  whileTap={{ scale: 0.96 }}
                  transition={tapSpring}
                >
                  Sign in with Riot
                </motion.button>
              </div>

              <div className="riot-modal-divider">
                <span>OR CONNECT VIA RIOT ID</span>
              </div>

              <form onSubmit={handleConnect} className="riot-modal-form">
                {error && <div className="riot-modal-error">{error}</div>}

                <div className="riot-modal-row">
                  <div className="riot-modal-field" style={{ flex: 2 }}>
                    <label className="t-micro">Riot Game Name</label>
                    <input
                      type="text"
                      className="riot-input"
                      placeholder="e.g. TenZ"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                      autoFocus
                    />
                  </div>
                  <div className="riot-modal-field" style={{ flex: 1 }}>
                    <label className="t-micro">Tagline</label>
                    <div className="riot-tag-wrapper">
                      <span className="riot-tag-prefix">#</span>
                      <input
                        type="text"
                        className="riot-input riot-input-tag"
                        placeholder="0001"
                        maxLength={5}
                        value={tag}
                        onChange={(e) => {
                          setTag(e.target.value);
                          setError("");
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="riot-modal-row">
                  <div className="riot-modal-field" style={{ flex: 1 }}>
                    <label className="t-micro">Region</label>
                    <select
                      className="riot-select"
                      value={region}
                      onChange={(e) => setRegion(e.target.value as Region)}
                    >
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="riot-modal-field" style={{ flex: 1.5 }}>
                    <label className="t-micro">Current Rank</label>
                    <select
                      className="riot-select"
                      value={rank}
                      onChange={(e) => setRank(e.target.value)}
                    >
                      {VALORANT_RANKS.map((rk) => (
                        <option key={rk} value={rk}>
                          {rk}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="riot-modal-field" style={{ flex: 1 }}>
                    <label className="t-micro">Current RR</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="riot-input"
                      value={rr}
                      onChange={(e) => setRr(e.target.value)}
                    />
                  </div>
                </div>

                <div className="riot-modal-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    whileTap={{ scale: 0.97 }}
                    transition={tapSpring}
                  >
                    <Crosshair size={16} /> Connect & Load Stats
                  </motion.button>
                </div>

                <div className="riot-modal-trust t-mono">
                  <ShieldCheck size={14} />
                  <span>Privacy-first · Local session · No third-party ad tracking</span>
                </div>
              </form>
            </Panel>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
