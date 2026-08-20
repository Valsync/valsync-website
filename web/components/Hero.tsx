"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import CommandLine from "./CommandLine";
import Readout from "./Readout";
import { POPULAR_PLAYERS, type PlayerPreview } from "@/lib/mock";

// three.js is heavy — keep the dither background in its own chunk so it
// mounts behind the boot loader instead of blocking first paint.
const Dither = dynamic(() => import("./Dither/Dither"), { ssr: false });

export default function Hero() {
  const [subject, setSubject] = useState<PlayerPreview>(POPULAR_PLAYERS[0]);

  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true">
        <Dither
          waveColor={[1, 0.27450980392156865, 0.3333333333333333]}
          colorNum={40}
          pixelSize={2}
          waveAmplitude={0}
          waveFrequency={3}
          waveSpeed={0.1}
          mouseRadius={0.2}
          enableMouseInteraction
        />
      </div>
      <div className="container hero-grid">
        <div>
          <div className="hero-meta">
            <span className="ticker"><span className="live" /> Season 2026 — Act 3</span>
            <span className="ticker">Patch 9.11</span>
          </div>
          <h1 className="hero-title h1">
            The scoreboard<br />
            for <span className="accent">Valorant</span>.<br />
            <span className="it">Search a Riot ID.</span>
          </h1>
          <p className="hero-sub">
            Look up a player. See their rank, region, win rate, last twenty rounds,
            and the agents they play. <b>One lookup, no clutter.</b>
          </p>
          <CommandLine onResult={setSubject} />
          <div className="cmd-hint">
            <span><kbd>⌘</kbd>K focus</span>
            <span><kbd>↵</kbd> run lookup</span>
            <span>NA · EU · AP · KR · BR · LATAM</span>
          </div>
        </div>
        <div>
          <Readout player={subject} />
        </div>
      </div>
    </section>
  );
}
