import type { CSSProperties } from "react";
import type { Crosshair as Xhair, CrosshairLines } from "./settings";

// Draws a VALORANT-style crosshair from the same parameters the game uses,
// in screen pixels. Used both on the range and as the settings preview.

function rgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

function Lines({ c, l }: { c: Xhair; l: CrosshairLines }) {
  if (!l.show || l.length <= 0 || l.thickness <= 0) return null;
  const shadow = c.outline ? `0 0 0 ${c.outlineThickness}px rgba(0,0,0,${c.outlineAlpha})` : "none";
  const base: CSSProperties = { position: "absolute", background: rgba(c.color, l.alpha), boxShadow: shadow };
  const half = l.thickness / 2;
  return (
    <>
      <i style={{ ...base, left: l.offset, top: -half, width: l.length, height: l.thickness }} />
      <i style={{ ...base, right: l.offset, top: -half, width: l.length, height: l.thickness }} />
      <i style={{ ...base, top: l.offset, left: -half, width: l.thickness, height: l.length }} />
      <i style={{ ...base, bottom: l.offset, left: -half, width: l.thickness, height: l.length }} />
    </>
  );
}

export default function Crosshair({ c, className }: { c: Xhair; className?: string }) {
  const d = c.dotThickness;
  return (
    <div className={className} aria-hidden>
      <div style={{ position: "relative", width: 0, height: 0 }}>
        <Lines c={c} l={c.inner} />
        <Lines c={c} l={c.outer} />
        {c.dot && (
          <i
            style={{
              position: "absolute",
              left: -d / 2,
              top: -d / 2,
              width: d,
              height: d,
              background: rgba(c.color, c.dotAlpha),
              boxShadow: c.outline ? `0 0 0 ${c.outlineThickness}px rgba(0,0,0,${c.outlineAlpha})` : "none",
            }}
          />
        )}
      </div>
    </div>
  );
}
