"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

type Accent = "neutral" | "red" | "cyan" | "gold";
type Fill = "surface" | "deep" | "low" | "high";

const ACCENT: Record<Accent, string> = {
  neutral: "",
  red: "panel-red",
  cyan: "panel-cyan",
  gold: "panel-gold",
};
const FILL: Record<Fill, string> = {
  surface: "",
  deep: "panel-deep",
  low: "panel-low",
  high: "panel-high",
};
const BRACKET_COLOR: Record<Accent, string> = {
  neutral: "rgb(171 136 135 / 0.55)",
  red: "rgb(255 82 93 / 0.7)",
  cyan: "rgb(0 234 184 / 0.7)",
  gold: "rgb(234 195 61 / 0.7)",
};

export type PanelProps = Omit<HTMLMotionProps<"div">, "children"> & {
  children?: React.ReactNode;
  /** Frame tint. Mirrors TelemetryPanel's `accent`. */
  accent?: Accent;
  /** Which surface step fills the panel. */
  fill?: Fill;
  /** Blueprint grid behind the content. */
  grid?: boolean;
  /** CRT scanline overlay. Use sparingly — the app does. */
  scanlines?: boolean;
  /** Sniper-reticle corner brackets. Hero panels only. */
  brackets?: boolean;
  /** 1px top highlight + bottom shadow. On by default, like TelemetryPanel. */
  bevel?: boolean;
};

/**
 * The chamfered HUD panel — the site's equivalent of the app's TelemetryPanel
 * (ui/components/ValTelemetry.kt).
 *
 * The diagonal cuts come from CSS `clip-path`, which would normally swallow
 * the border along the cut; `.panel` in globals.css works around that by
 * painting a clipped edge layer with the fill inset one pixel inside it.
 */
export default function Panel({
  accent = "neutral",
  fill = "surface",
  grid = false,
  scanlines = false,
  brackets = false,
  bevel = true,
  className,
  children,
  style,
  ...rest
}: PanelProps) {
  return (
    <motion.div
      className={cn(
        "panel",
        ACCENT[accent],
        FILL[fill],
        bevel && "bevel",
        className
      )}
      style={style}
      {...rest}
    >
      {grid && <span className="layer grid-bg" aria-hidden />}
      {scanlines && <span className="layer layer-scanlines" aria-hidden />}
      {brackets && (
        <span
          className="brackets"
          aria-hidden
          style={{ ["--bracket-color" as string]: BRACKET_COLOR[accent] }}
        >
          <i />
          <i />
          <i />
          <i />
        </span>
      )}
      {children}
    </motion.div>
  );
}
