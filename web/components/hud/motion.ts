import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion vocabulary.
 *
 * The app's ValMotion tunes everything off a small set of curves rather than
 * letting each screen invent its own; the site does the same so a card on the
 * pricing grid settles with the same weight as a row in the changelog.
 */

/** Default settle — quick out, long tail. Matches the app's standard easing. */
export const easeOut = [0.16, 1, 0.3, 1] as const;

/** Panels and rows entering the viewport. */
export const enterSpring: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 20,
  mass: 0.9,
};

/** Press/hover feedback — stiff enough to feel mechanical, not bouncy. */
export const tapSpring: Transition = {
  type: "spring",
  stiffness: 400,
  damping: 26,
};

/** Container that hands its children a stagger. Pair with `riseItem`. */
export const staggerParent = (stagger = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: {
    transition: { staggerChildren: stagger, delayChildren: delay },
  },
});

/** The house entrance: up and in. */
export const riseItem: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: easeOut } },
};

/** For rows in a list — comes in from the leading edge instead of below. */
export const slideItem: Variants = {
  hidden: { opacity: 0, x: -18 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: easeOut } },
};

/** Readouts and numbers: no travel, just resolve. */
export const fadeItem: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.5, ease: easeOut } },
};

/** Viewport config used by every scroll-triggered section. */
export const viewportOnce = { once: true, amount: 0.25 } as const;
