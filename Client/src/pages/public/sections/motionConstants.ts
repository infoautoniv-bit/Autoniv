import type { Transition } from "framer-motion";

/* ─── Premium Easings ────────────────────────────────────────────────────────
   Apple/Stripe-quality easing curves. Each has a distinct personality:
   - EXPO_OUT: Aggressive deceleration — snappy, confident (buttons, reveals)
   - CUBIC_OUT: Smooth deceleration — elegant, refined (text, cards)
   - SPRING: Physical spring — lively, organic (hover, magnetic)
   - SMOOTH: Ultra-smooth — cinematic, luxurious (parallax, scroll)
   - ELASTIC: Bouncy overshoot — playful, premium (micro-interactions)
   ──────────────────────────────────────────────────────────────────────────── */

export const EXPO_OUT: Transition["ease"] = [0.16, 1, 0.3, 1];
export const CUBIC_OUT: Transition["ease"] = [0.33, 1, 0.68, 1];
export const SMOOTH: Transition["ease"] = [0.25, 0.1, 0.25, 1];
export const SPRING: Transition["type"] = "spring";
export const SPRING_CONFIG = { stiffness: 300, damping: 30, mass: 0.8 } as const;
export const ELASTIC: Transition["ease"] = [0.68, -0.55, 0.27, 1.55];

// Backwards compat
export const EASE_OUT: Transition["ease"] = EXPO_OUT;
export const EASE_IN_OUT: Transition["ease"] = [0.65, 0, 0.35, 1];

export const VIEWPORT = { once: true, margin: "-80px" } as const;
export const VIEWPORT_WIDE = { once: true, margin: "-120px" } as const;
