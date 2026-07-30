"use client";
import { type PlayerPreview } from "@/lib/mock";

const FORM: Record<string, boolean[]> = {
  TenZ:      [true, true, false, true, true, true, false, true, true, true, false, true, true, true, false, true, true, true, true, true],
  aspas:     [true, true, true, false, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true],
  yay:       [true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, true, true, true],
  Demon1:    [false, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true, false, true],
  Derke:     [true, true, false, true, true, true, true, false, true, true, true, true, true, true, false, true, true, true, true, true],
  Chronicle: [true, false, true, true, true, false, true, true, true, true, true, false, true, true, true, true, true, false, true, true],
  Sacy:      [true, true, true, false, true, true, false, true, true, true, true, true, false, true, true, true, true, false, true, true],
  Zekken:    [true, true, true, true, false, true, true, true, true, true, false, true, true, true, true, false, true, true, true, true],
  Less:      [false, true, true, true, true, true, false, true, true, false, true, true, true, true, true, true, false, true, true, true],
};

function formFor(p: PlayerPreview) {
  return FORM[p.name] || Array.from({ length: 20 }, () => Math.random() > 0.3);
}

export default function Readout({ player }: { player: PlayerPreview }) {
  const form = formFor(player);
  const wins = form.filter(Boolean).length;
  const lastDelta = 28; // static demo value
  const hsPct = 28 + (player.winRate % 7);

  return (
    <aside className="readout" aria-label="Player readout">
      <span className="tick-tl" /><span className="tick-tr" />
      <span className="tick-bl" /><span className="tick-br" />
      <div className="readout-head">
        <span>Player Profile · {player.region}</span>
        <span className="live">LIVE</span>
      </div>
      <div className="readout-body">
        <div className="readout-name">
          <div className="player">{player.name}<span className="tag">#{player.tag}</span></div>
          <div className="flag">{player.region} · {player.tag}</div>
        </div>
        <div className="readout-meta">
          <div className="cell">
            <div className="k">Rank</div>
            <div className="v" style={{ color: "var(--amber)" }}>{player.rank}</div>
          </div>
          <div className="cell">
            <div className="k">Win Rate</div>
            <div className="v">{player.winRate}<span className="unit" style={{ fontSize: "0.5em", color: "var(--faint)" }}>%</span></div>
          </div>
          <div className="cell">
            <div className="k">RR</div>
            <div className="v up">+{lastDelta}</div>
          </div>
          <div className="cell">
            <div className="k">HS%</div>
            <div className="v">{hsPct}<span className="unit" style={{ fontSize: "0.5em", color: "var(--faint)" }}>%</span></div>
          </div>
        </div>
        <div className="readout-form">
          <div className="label">Last 20 · {wins}W {20 - wins}L</div>
          <div className="bars">
            {form.map((win, i) => <span key={i} className={win ? "is-win" : "is-loss"} />)}
          </div>
        </div>
      </div>
      <div className="readout-foot">
        <span>Agent · {player.agent}</span>
        <span>Updated 2s ago</span>
      </div>
    </aside>
  );
}
