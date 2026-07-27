"use client";
import { useMemo } from "react";

type Item = { k: string; v: string; tone?: "up" | "down" | "amber" };

const ITEMS: Item[] = [
  { k: "TenZ",          v: "+28 RR", tone: "up" },
  { k: "aspas#BR1",     v: "97% WR", tone: "up" },
  { k: "yay#NA1",       v: "ACS 312", tone: "amber" },
  { k: "Derke#EU1",     v: "5W streak", tone: "up" },
  { k: "Jett",          v: "54.2% pick", tone: "amber" },
  { k: "Haven",         v: "52% attack", tone: "amber" },
  { k: "Radiant",       v: "#74 worldwide", tone: "up" },
  { k: "Demon1#NA1",    v: "K/D 1.48", tone: "up" },
  { k: "Bind",          v: "retake 41%", tone: "down" },
  { k: "Sova",          v: "+1.2% win", tone: "up" },
  { k: "Less#BR1",      v: "+19 RR", tone: "up" },
  { k: "Omen",          v: "49.8% pick", tone: "amber" },
];

export default function Ticker() {
  const doubled = useMemo(() => [...ITEMS, ...ITEMS], []);
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {doubled.map((it, i) => (
          <span className="item" key={i}>
            <span className="k">{it.k}</span>
            <span className="v">·</span>
            <span className={`v ${it.tone ?? ""}`}>{it.v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
