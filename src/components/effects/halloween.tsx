/**
 * Halloween theme decorations, rendered by the root layout only while the
 * halloween theme is active. Pure markup animated by CSS in globals.css
 * (.halloween-pumpkins / .halloween-fog), so they never trigger React renders,
 * and they are paused for prefers-reduced-motion.
 */

/** Faint jack-o'-lantern pattern (public/effects/pumpkins.svg) drifting diagonally behind the page. */
export function HalloweenPumpkins() {
  return <div className="halloween-pumpkins" aria-hidden />;
}

export function HalloweenFog() {
  return <div className="halloween-fog" aria-hidden />;
}
