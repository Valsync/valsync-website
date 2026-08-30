import { cn } from "@/lib/utils";

const COLOR = {
  faint: "var(--fg-faint)",
  red: "var(--red)",
  cyan: "var(--cyan)",
  gold: "var(--gold)",
} as const;

/**
 * `[ SECTION NAME ]` — the app's section marker (ValTelemetry.BracketLabel).
 * The brackets themselves sit at reduced opacity so the word reads first.
 */
export default function BracketLabel({
  children,
  tone = "faint",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof COLOR;
  className?: string;
}) {
  return (
    <span
      className={cn("bracket-label", className)}
      style={{ ["--label-color" as string]: COLOR[tone] }}
    >
      <span aria-hidden>[</span>
      <span>{children}</span>
      <span aria-hidden>]</span>
    </span>
  );
}
