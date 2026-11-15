// =============================================================================
// src/hooks/useParticipants.js
// =============================================================================
// A CUSTOM HOOK: a function whose name starts with "use" that calls other hooks
// (useState, useEffect ...) and packages related logic so any component can
// reuse it. This hook owns ALL participant data and the only functions allowed
// to change it. Components just call these functions - they never touch the
// state directly.
//
// WHY THE STATE LIVES HERE (and App calls this hook) AND NOT IN <Tile>?
// "Lifting state up": several parts of the UI need the same data (the grid, the
// header count, the buttons). State should live in the closest common parent
// (App, through this hook) and flow DOWN as props. Children ask for changes by
// calling callback functions that flow back UP.
//
// WHY IMMUTABLE UPDATES?
// React decides whether to re-render by comparing the OLD state with the NEW
// state using ===. If you change an array in place (push, p.muted = true) it is
// still the SAME array object, React sees "no change" and may skip the update -
// and bugs appear that are very hard to trace. So every update below builds a
// NEW array (and a NEW object for any participant that changes).
// =============================================================================

import { useState, useEffect } from 'react'
import {
  MAX_PARTICIPANTS,
  createParticipant,
  getInitialParticipants,
  isValidParticipant,
  normalizeName,
  pickRandomSpeaker,
  pickUnusedName,
  withSpeaker,
} from '../lib/participantUtils.js'

// How often the (optional) simulation picks a new speaker.
const SPEAKING_INTERVAL_MS = 1500

export function useParticipants({ simulateSpeaking = false } = {}) {
  // useState remembers the list between renders. We pass the FUNCTION
  // getInitialParticipants (not its result) so React calls it only once, on the
  // first render, instead of creating new UUIDs on every render.
  const [participants, setParticipants] = useState(getInitialParticipants)

  // ---------------------------------------------------------------------------
  // ADD
  // ---------------------------------------------------------------------------
  function addParticipant(name) {
    if (participants.length >= MAX_PARTICIPANTS) return

    // The new object (and its random id) is created OUTSIDE the updater below.
    // Updater functions should be "pure" - same input, same output.
    const newParticipant = createParticipant(
      normalizeName(name) || pickUnusedName(participants),
    )
    if (!isValidParticipant(newParticipant)) return

    // Spread syntax: [...current, x] copies every item of `current` into a
    // brand-new array and then appends x. `current.push(x)` would change the
    // old array in place - forbidden for React state.
    // Passing a function (current => ...) guarantees we start from the LATEST
    // list even if several updates are queued in the same event.
    setParticipants((current) => [...current, newParticipant])
  }

  // ---------------------------------------------------------------------------
  // REMOVE
  // ---------------------------------------------------------------------------
  function removeParticipant(id) {
    // .filter() returns a NEW array containing only the items for which the
    // test is true. Everybody except the one with this id stays - and they keep
    // their own ids, so their identity is preserved.
    setParticipants((current) => current.filter((p) => p.id !== id))
  }

  // ---------------------------------------------------------------------------
  // MUTE / UNMUTE
  // ---------------------------------------------------------------------------
  function toggleMute(id) {
    // .map() builds a NEW array with one result per item. For the selected
    // participant we return a NEW object: { ...p, muted: !p.muted } copies all
    // of p's properties and then overrides `muted`. Everyone else is returned
    // untouched, so only the chosen person changes.
    setParticipants((current) =>
      current.map((p) => {
        if (p.id !== id) return p
        const nowMuted = !p.muted
        // A muted person cannot be "speaking", so we clear that flag too.
        return { ...p, muted: nowMuted, speaking: nowMuted ? false : p.speaking }
      }),
    )
  }

  // ---------------------------------------------------------------------------
  // OPTIONAL SPEAKING SIMULATION (useEffect + cleanup)
  // ---------------------------------------------------------------------------
  // useEffect runs code AFTER React has drawn the screen - the right place for
  // "side effects" such as timers. It re-runs whenever a value in the
  // dependency array [simulateSpeaking] changes.
  useEffect(() => {
    if (!simulateSpeaking) {
      // Switched off: make sure nobody stays highlighted. We return the SAME
      // array when nobody is speaking so React does not re-render for nothing.
      setParticipants((current) =>
        current.some((p) => p.speaking) ? withSpeaker(current, null) : current,
      )
      return undefined
    }

    function pickNextSpeaker() {
      // current => ... always reads the latest list, so this effect does NOT
      // need `participants` in its dependency array (which would restart the
      // timer on every change).
      setParticipants((current) => withSpeaker(current, pickRandomSpeaker(current)))
    }

    pickNextSpeaker() // show a speaker immediately instead of waiting 1.5 s
    const timerId = setInterval(pickNextSpeaker, SPEAKING_INTERVAL_MS)

    // CLEANUP FUNCTION: React calls this before the effect runs again and when
    // the component disappears. Without clearInterval the old timer would keep
    // firing forever ("a leak"): every toggle would add one more interval, the
    // speaker would change faster and faster, and the timers would update state
    // of components that no longer exist. React's StrictMode (see main.jsx)
    // deliberately runs mount -> cleanup -> mount in development to expose
    // missing cleanups - ours is correct, so only one interval is ever alive.
    return () => clearInterval(timerId)
  }, [simulateSpeaking])

  return {
    participants,
    addParticipant,
    removeParticipant,
    toggleMute,
    maxParticipants: MAX_PARTICIPANTS,
  }
}
