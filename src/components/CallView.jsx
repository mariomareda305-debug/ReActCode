// =============================================================================
// src/components/CallView.jsx
// =============================================================================
// Draws the whole grid of participants. It receives the list as a prop and one
// callback per action. It never changes the data itself.
//
// HOW CALLBACKS WORK (data down, events up)
// The parent passes functions as props (onToggleMute, onRemove). When the user
// clicks a button here, we CALL that function with the participant's id. The
// function was created in the parent/hook, so the change happens there, React
// re-renders, and the new list comes back down as a prop.
// =============================================================================

import Tile from './Tile.jsx'

export default function CallView({
  participants,
  localStream = null, // CAMERA UPDATE: the user's own camera stream (or null)
  keyMode = 'id',
  controlsDisabled = false,
  onToggleMute,
  onRemove,
}) {
  // Never show an empty/blank area: explain what to do instead.
  // (With the camera on, the "You" tile counts as content, so no message.)
  if (participants.length === 0 && !localStream) {
    return (
      <div className="empty-state" role="status">
        <p className="empty-state__title">Nobody is in the call.</p>
        <p>Use “Add participant” above to bring someone in.</p>
      </div>
    )
  }

  return (
    <ul className="call-grid" aria-label="Participants">
      {/* CAMERA UPDATE: the user's own tile. It is NOT part of the participants
          array (you cannot mute or remove yourself with these buttons), so it
          is rendered by hand before the mapped list. It needs its own fixed
          key, "local", which can never clash with a participant id. */}
      {localStream && (
        <li key="local" className="call-grid__item">
          <Tile name="You" muted={false} speaking={false} stream={localStream} />
        </li>
      )}

      {/* .map() walks through the array and returns ONE <li> per participant,
          producing a new array of JSX elements that React draws.

          REACT KEYS: React needs a `key` on each item to know which item is
          which between renders. With key = participant.id, "Bob" is always
          recognised as Bob, even when Alice before him is removed: React keeps
          Bob's existing DOM elements (including the text typed in his
          uncontrolled note input) and just deletes Alice's.

          EDUCATIONAL DEMO ONLY: when keyMode is 'index', the key becomes the
          array position instead. After removing the first person, Bob moves
          from position 1 to position 0, and React thinks "key 0 is still the
          same item" - it reuses Alice's old DOM (with her typed note) and just
          changes the props to Bob's. That is the bug the experiment shows.
          NEVER use the index as a key for lists that can change order or lose
          items. The normal app always uses keyMode 'id'. */}
      {participants.map((participant, index) => (
        <li
          key={keyMode === 'index' ? index : participant.id}
          className="call-grid__item"
        >
          <Tile
            name={participant.name}
            muted={participant.muted}
            speaking={participant.speaking}
          >
            <div className="tile__actions">
              <button
                type="button"
                className="btn btn--secondary btn--small"
                aria-pressed={participant.muted}
                disabled={controlsDisabled}
                onClick={() => onToggleMute(participant.id)}
              >
                {participant.muted ? 'Unmute' : 'Mute'}
                <span className="visually-hidden"> {participant.name}</span>
              </button>
              <button
                type="button"
                className="btn btn--danger btn--small"
                disabled={controlsDisabled}
                onClick={() => onRemove(participant.id)}
              >
                Remove
                <span className="visually-hidden"> {participant.name}</span>
              </button>
            </div>
          </Tile>
        </li>
      ))}
    </ul>
  )
}
