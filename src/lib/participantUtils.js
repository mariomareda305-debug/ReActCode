// =============================================================================
// src/lib/participantUtils.js
// =============================================================================
// PURPOSE OF THIS MODULE
// Plain JavaScript helpers for working with participant objects.
//
// WHY THERE IS NO `import ... from 'react'` IN THIS FILE
// Everything here is a "pure function": give it the same inputs and it returns
// the same output, and it never touches the screen, React state or the DOM.
// Keeping the lib/ folder independent of React gives us three benefits:
//   1. Easy testing - you can call these functions from any test runner (or
//      even the browser console) without rendering a component.
//   2. Reuse - the same logic works in a hook, a component, or a future server.
//   3. One source of truth - business rules (e.g. "names are at most 24
//      characters") live in ONE place instead of being copied into components.
// =============================================================================

export const MAX_PARTICIPANTS = 12
export const MAX_NAME_LENGTH = 24

// Names offered by default when the user adds a participant without typing one.
const SAMPLE_NAMES = [
  'Alice', 'Bob', 'Charlie', 'Diana', 'Ethan', 'Fatima',
  'George', 'Hana', 'Ivan', 'Jasmine', 'Karim', 'Layla',
]

// -----------------------------------------------------------------------------
// IDs
// -----------------------------------------------------------------------------
// A participant's `id` is its IDENTITY. It is generated once and never changes,
// even if the person is renamed, muted or moved in the list. (An array index is
// NOT an identity: it changes whenever someone before you is removed.)
//
// crypto.randomUUID() only exists in "secure contexts" (https:// or localhost),
// so we fall back to a random string if it is unavailable.
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

// -----------------------------------------------------------------------------
// Names
// -----------------------------------------------------------------------------
// Trims, collapses repeated spaces and limits the length. Returns '' if the
// input is not usable, so callers can decide on a fallback.
export function normalizeName(rawName) {
  if (typeof rawName !== 'string') return ''
  return rawName.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)
}

// Picks the first sample name that nobody in `participants` is using yet,
// otherwise "Guest 13", "Guest 14", ... Names are labels only; identity is `id`.
export function pickUnusedName(participants) {
  const used = new Set(participants.map((p) => p.name))
  const free = SAMPLE_NAMES.find((name) => !used.has(name))
  return free ?? `Guest ${participants.length + 1}`
}

// Two-letter avatar text, e.g. "Alice Smith" -> "AS", "Bob" -> "BO".
export function getInitials(name) {
  const words = normalizeName(name).split(' ').filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

// -----------------------------------------------------------------------------
// Creating and validating participants
// -----------------------------------------------------------------------------
// The participant data model:
//   { id: string, name: string, muted: boolean, speaking: boolean }
export function createParticipant(name) {
  return {
    id: generateId(),
    name: normalizeName(name) || 'Guest',
    muted: false,
    speaking: false,
  }
}

// Returns true only if `value` has exactly the shape the UI expects.
export function isValidParticipant(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    typeof value.muted === 'boolean' &&
    typeof value.speaking === 'boolean'
  )
}

// Sample data: the three participants the app starts with.
export function getInitialParticipants() {
  return ['Alice', 'Bob', 'Charlie'].map(createParticipant)
}

// -----------------------------------------------------------------------------
// Speaking helpers (used by the optional speaking simulation)
// -----------------------------------------------------------------------------
// Chooses a random participant who is NOT muted and returns their id, or null
// if everyone is muted. `random` can be replaced in tests to make the result
// predictable, e.g. pickRandomSpeaker(list, () => 0).
export function pickRandomSpeaker(participants, random = Math.random) {
  const candidates = participants.filter((p) => !p.muted)
  if (candidates.length === 0) return null
  return candidates[Math.floor(random() * candidates.length)].id
}

// Returns a NEW array in which only `speakerId` is speaking (pass null to
// silence everyone). People whose value does not change keep the SAME object,
// which lets React skip re-rendering their tiles.
// It never modifies the array or the objects it receives.
export function withSpeaker(participants, speakerId) {
  return participants.map((p) => {
    const shouldSpeak = p.id === speakerId
    return p.speaking === shouldSpeak ? p : { ...p, speaking: shouldSpeak }
  })
}
