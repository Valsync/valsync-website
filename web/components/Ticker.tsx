"use client";
import { FLOATING_STATS } from "@/lib/mock";

/**
 * A marquee of readouts between the hero and the first section — the pause on
 * hover is there so anyone who wants to actually read a value can.
 */
export default function Ticker() {
  const items = [...FLOATING_STATS, "LOCAL-FIRST", "RIOT API", "ANDROID"];
  return (
    <div className="ticker" aria-hidden>
      <div className="ticker-track">
        {[0, 1].map((pass) => (
          <div key={pass} style={{ display: "flex" }}>
            {items.map((item, i) => (
              <span className="ticker-item" key={`${pass}-${i}`}>
                {item}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
