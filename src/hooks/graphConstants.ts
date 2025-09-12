// Centralized graph interaction and simulation constants
// Values preserved from existing implementation (do not change without confirmation)
export const NODE_SPEED_THRESHOLD = 0.5
export const NODE_IDLE_RATIO = 0.9
export const IDLE_TICKS_TO_STOP = 5
export const KICK_ALPHA_TARGET = 0.3
export const KICK_RELAX_TO = 0.05
export const KICK_RELAX_AFTER_MS = 1200
// Drag pixel threshold: existing code treats any movement (>0) as a drag.
// Keep default 0 to preserve current behavior; change only if desired.
export const DRAG_PIXEL_THRESHOLD = 0
