// =============================================================================
// src/lib/connectionStates.js   (extra file - see GUIDE.md for why it exists)
// =============================================================================
// The connection "state machine" described in plain JavaScript.
//
// WHY A STATE MACHINE INSTEAD OF `isConnected` (true/false)?
// A call is not simply "connected or not". There are at least five situations:
//   idle         - nothing started yet
//   connecting   - trying to join
//   connected    - in the call
//   reconnecting - the network dropped, trying to get back in
//   failed       - gave up, show an error
// With Booleans you would need isConnecting, isConnected, hasError ... and it
// becomes possible to hold contradictory values at once (isConnected = true AND
// hasError = true). A SINGLE `status` value can only ever be ONE of the five
// strings, so impossible combinations simply cannot exist, and every screen
// can be chosen with one clear question: "what is the status?"
// =============================================================================

// Object.freeze makes the object read-only, so nobody can add a sixth status
// by accident while the program is running.
export const CONNECTION_STATUS = Object.freeze({
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  FAILED: 'failed',
})

// Handy list of the five allowed values, in a sensible demo order.
export const ALL_STATUSES = Object.freeze(Object.values(CONNECTION_STATUS))

// Human-friendly names for badges and buttons.
export const STATUS_LABELS = Object.freeze({
  idle: 'Idle',
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  failed: 'Failed',
})

// Which moves are legal in normal use. (The demo panel can still jump anywhere
// on purpose, so the instructor can show every screen quickly.)
const ALLOWED_TRANSITIONS = Object.freeze({
  idle: ['connecting'],
  connecting: ['connected', 'failed', 'idle'],
  connected: ['reconnecting', 'idle'],
  reconnecting: ['connected', 'failed', 'idle'],
  failed: ['connecting', 'idle'],
})

export function isValidStatus(value) {
  return ALL_STATUSES.includes(value)
}

export function canTransition(from, to) {
  return isValidStatus(from) && (ALLOWED_TRANSITIONS[from] ?? []).includes(to)
}

// True when the participant grid should be on screen.
export function isInCallStatus(status) {
  return status === CONNECTION_STATUS.CONNECTED || status === CONNECTION_STATUS.RECONNECTING
}
