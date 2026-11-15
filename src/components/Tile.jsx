// =============================================================================
// src/components/Tile.jsx
// =============================================================================
// A <Tile> draws ONE participant's card. It is PRESENTATIONAL: it receives data
// through props and returns JSX. It has no useState and never changes the
// participant list - it only displays what it is given.
//
// PROPS are the inputs of a component, just like function arguments. The parent
// passes them as attributes: <Tile name="Alice" muted={false} speaking={true} />
// Props are read-only: a child must never modify them.
// `children` is a special prop: whatever JSX the parent puts BETWEEN
// <Tile> ... </Tile>. CallView uses it to place the mute/remove buttons inside
// the card without Tile needing to know anything about them.
// =============================================================================

import { getInitials } from '../lib/participantUtils.js'
import CameraPreview from './CameraPreview.jsx'

// CAMERA UPDATE: Tile accepts one more OPTIONAL prop, `stream`. When it is a
// MediaStream the tile shows live video instead of the initials avatar. Other
// participants are simulated, so they never receive a stream.
export default function Tile({ name, muted, speaking, stream = null, children }) {
  // CSS classes: every tile has "tile". We append a modifier class when a
  // condition is true. .filter(Boolean) removes the empty strings, and
  // .join(' ') produces e.g. "tile tile--speaking". All visual styling lives in
  // App.css - React only decides WHICH classes are present.
  const className = ['tile', muted && 'tile--muted', speaking && 'tile--speaking']
    .filter(Boolean)
    .join(' ')

  return (
    // <article> is a meaningful HTML element for a self-contained item; the
    // aria-label gives screen-reader users the participant's name.
    <article className={className} aria-label={`Participant ${name}`}>
      <div className="tile__video">
        {/* CONDITIONAL RENDERING with a ternary (condition ? A : B): show live
            video when we have a stream, otherwise the initials avatar.
            aria-hidden: the initials are decoration; the name is read below. */}
        {stream ? (
          <CameraPreview stream={stream} label={`Live camera of ${name}`} />
        ) : (
          <div className="avatar" aria-hidden="true">
            {getInitials(name)}
          </div>
        )}

        <div className="tile__badges">
          {/* CONDITIONAL RENDERING: `condition && <jsx/>` renders the JSX only
              when the condition is true; when it is false, React renders
              nothing. The indicators use TEXT as well as colour/icons so the
              meaning is clear to everyone. */}
          {muted && (
            <span className="badge badge--muted">
              <span aria-hidden="true">🔇</span> Muted
            </span>
          )}
          {speaking && (
            <span className="badge badge--speaking">
              <span className="eq" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              Speaking
            </span>
          )}
        </div>
      </div>

      <h3 className="tile__name">{name}</h3>

      {/* UNCONTROLLED INPUT: there is no `value` and no `onChange`, so React
          does not track what is typed. The browser's own DOM element keeps the
          text. `defaultValue` only sets the starting text. Compare this with
          the "add participant" box in App.jsx, which IS controlled (React state
          holds its value).
          This is exactly why keys matter: the typed text lives in the DOM node,
          and React decides which DOM node belongs to which tile by its KEY.
          See the keys experiment in the README. */}
      <label className="tile__note">
        <span className="tile__note-label">Note for {name}</span>
        <input type="text" defaultValue="" placeholder="Type a note…" maxLength={60} />
      </label>

      {children}
    </article>
  )
}
