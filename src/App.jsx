// =============================================================================
// src/App.jsx - the coordinator
// =============================================================================
// App owns the state that several parts of the screen share and passes it DOWN
// to child components as props:
//   - participants + their actions  <- from the useParticipants hook
//   - status (the connection state machine)
//   - simulateSpeaking, keyMode, newName (small UI settings)
// Children report user actions back UP by calling the callback props below.
// =============================================================================

import { useEffect, useState } from 'react'
import './App.css'
import CallView from './components/CallView.jsx'
import CandidatePanel from './components/CandidatePanel.jsx'
import ConnectionStatus, { StatusBadge } from './components/ConnectionStatus.jsx'
import { useParticipants } from './hooks/useParticipants.js'
import { CAMERA_STATUS, useCamera } from './hooks/useCamera.js'
import {
  ALL_STATUSES,
  CONNECTION_STATUS,
  STATUS_LABELS,
  canTransition,
  isInCallStatus,
  isValidStatus,
} from './lib/connectionStates.js'
import { MAX_NAME_LENGTH } from './lib/participantUtils.js'

// Vite replaces import.meta.env.DEV with true under `npm run dev` and false in
// a production build, so the demo panel is only available while developing.
const SHOW_DEMO_PANEL = import.meta.env.DEV

// Short explanation shown in the "Learn" panel for each state.
const LESSONS = {
  idle: 'Nothing has started. The status is the single string "idle", so the app shows the welcome screen. A state machine means exactly ONE of the five screens is true at any time.',
  connecting: 'The status is "connecting". We show a spinner and let the instructor choose what happens next. Only some moves are legal from here: connected, failed, or back to idle.',
  connected: 'The status is "connected". The grid shows participants. Each participant is an object in React state; every button creates a NEW array instead of editing the old one (immutability).',
  reconnecting: 'The status is "reconnecting". This is why a Boolean like isConnected is not enough: we are neither fully connected nor failed, so the grid stays visible under a warning banner.',
  failed: 'The status is "failed". The user gets an understandable message plus a way forward: Retry goes back to "connecting", Back to start goes to "idle".',
}

export default function App() {
  // ---- State owned by App --------------------------------------------------
  // ONE value for the connection instead of several Booleans that could
  // contradict each other.
  const [status, setStatus] = useState(CONNECTION_STATUS.IDLE)
  const [simulateSpeaking, setSimulateSpeaking] = useState(false)
  // 'id' = correct behaviour. 'index' = the educational keys experiment only.
  const [keyMode, setKeyMode] = useState('id')
  // CONTROLLED input: React state holds the text, so the box always shows
  // exactly what is in `newName`.
  const [newName, setNewName] = useState('')

  const inCall = isInCallStatus(status)
  const reconnecting = status === CONNECTION_STATUS.RECONNECTING

  // The timer only runs while truly connected. When the status changes, the
  // effect's cleanup stops it automatically.
  const { participants, addParticipant, removeParticipant, toggleMute, maxParticipants } =
    useParticipants({ simulateSpeaking: simulateSpeaking && status === CONNECTION_STATUS.CONNECTED })

  const atLimit = participants.length >= maxParticipants

  // CAMERA UPDATE: all camera logic lives in the useCamera hook. App only
  // decides WHEN to start/stop it, exactly like it does for participants.
  const camera = useCamera()
  const cameraOn = camera.status === CAMERA_STATUS.ON
  const cameraRequesting = camera.status === CAMERA_STATUS.REQUESTING
  const stopCamera = camera.stop

  // When the user leaves the call (idle, connecting, failed) the camera must be
  // switched off. Reacting to a state change is a job for useEffect: it runs
  // after the screen updates whenever `inCall` changes. Note that
  // "reconnecting" still counts as in-call, so the camera stays on.
  useEffect(() => {
    if (!inCall) stopCamera()
  }, [inCall, stopCamera])

  // ---- Connection transitions ---------------------------------------------
  // Normal buttons use goTo(), which refuses illegal moves
  // (e.g. idle -> connected without connecting first).
  function goTo(next) {
    if (!canTransition(status, next)) {
      console.warn(`Ignored illegal transition: ${status} -> ${next}`)
      return
    }
    setStatus(next)
  }

  // The demo panel is allowed to jump to any of the five states on purpose.
  function jumpTo(next) {
    if (isValidStatus(next)) setStatus(next)
  }

  // ---- Event handlers ------------------------------------------------------
  function handleAddSubmit(event) {
    event.preventDefault() // stop the browser from reloading the page
    addParticipant(newName)
    setNewName('')
  }

  const countLabel = `${participants.length} ${participants.length === 1 ? 'participant' : 'participants'}`

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand__logo" aria-hidden="true">🎥</span>
          <div>
            <h1 className="brand__title">MeetShell</h1>
            <p className="brand__sub">MMD 410 · Week 1 · Lab 1: The Application Shell</p>
          </div>
        </div>
        <div className="app-header__meta">
          <StatusBadge status={status} />
          <span className="count-pill">
            <span aria-hidden="true">👥</span> {countLabel}
          </span>
        </div>
      </header>

      <main className="app-main">
        {SHOW_DEMO_PANEL && (
          <section className="panel panel--demo" aria-labelledby="demo-title">
            <h2 id="demo-title" className="panel__title">
              Demo panel <span className="tag">development only</span>
            </h2>
            <p className="panel__text">Jump straight to any connection state:</p>
            <div className="demo-buttons">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn btn--secondary btn--small"
                  aria-pressed={status === s}
                  onClick={() => jumpTo(s)}
                >
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="panel panel--lesson" aria-labelledby="lesson-title">
          <h2 id="lesson-title" className="panel__title">
            Learn: state is “{status}”
          </h2>
          <p className="panel__text" aria-live="polite">{LESSONS[status]}</p>
        </section>
       
        <CandidatePanel />
        {/* The status component renders a different screen for each state. */}
        <ConnectionStatus
          status={status}
          participantCount={participants.length}
          onJoin={() => goTo(CONNECTION_STATUS.CONNECTING)}
          onConnected={() => goTo(CONNECTION_STATUS.CONNECTED)}
          onFailed={() => goTo(CONNECTION_STATUS.FAILED)}
          onRetry={() => goTo(CONNECTION_STATUS.CONNECTING)}
          onBackToIdle={() => goTo(CONNECTION_STATUS.IDLE)}
        />
   
        {/* Conditional rendering: the grid and its controls appear in BOTH
            "connected" and "reconnecting", so reconnecting never hides it. */}
        {inCall && (
          <>
            <section className="panel" aria-labelledby="controls-title">
              <h2 id="controls-title" className="panel__title">Participant controls</h2>
              <div className="controls">
                <form className="add-form" onSubmit={handleAddSubmit}>
                  <label className="field">
                    <span className="field__label">New participant name (optional)</span>
                    <input
                      type="text"
                      value={newName}
                      maxLength={MAX_NAME_LENGTH}
                      disabled={reconnecting}
                      placeholder="e.g. Diana"
                      onChange={(event) => setNewName(event.target.value)}
                    />
                  </label>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={reconnecting || atLimit}
                  >
                    Add participant
                  </button>
                </form>

                <div className="controls__extra">
                  {/* CAMERA UPDATE: one toggle button. Its label and action
                      depend on the single camera status string. */}
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={cameraRequesting || (reconnecting && !cameraOn)}
                    onClick={cameraOn ? camera.stop : camera.start}
                  >
                    {cameraRequesting
                      ? 'Waiting for permission…'
                      : cameraOn
                        ? 'Turn camera off'
                        : 'Turn camera on'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    aria-pressed={simulateSpeaking}
                    disabled={reconnecting}
                    onClick={() => setSimulateSpeaking((on) => !on)}
                  >
                    Simulate speaking: {simulateSpeaking ? 'On' : 'Off'}
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    onClick={() => goTo(CONNECTION_STATUS.IDLE)}
                  >
                    Leave call
                  </button>
                </div>
              </div>
              {/* Friendly camera feedback. role="alert" makes screen readers
                  announce a problem; the message text comes from the hook. */}
              {camera.errorMessage && (
                <p className="camera-error" role="alert">
                  {camera.errorMessage}
                </p>
              )}
              {cameraRequesting && (
                <p className="panel__text" role="status">
                  Your browser is asking for camera permission. Click “Allow”.
                </p>
              )}
              {atLimit && (
                <p className="panel__text" role="status">
                  The room is full ({maxParticipants} participants).
                </p>
              )}
            </section>

            <section className="call-section" aria-labelledby="grid-title">
              <h2 id="grid-title" className="call-section__title">
                In the call · {countLabel}
              </h2>
              <CallView
                participants={participants}
                localStream={camera.stream}
                keyMode={keyMode}
                controlsDisabled={reconnecting}
                onToggleMute={toggleMute}
                onRemove={removeParticipant}
              />
            </section>

            <section
              className={`panel keys-panel${keyMode === 'index' ? ' keys-panel--active' : ''}`}
              aria-labelledby="keys-title"
            >
              <h2 id="keys-title" className="panel__title">
                Experiment: why React keys matter{' '}
                <span className="tag tag--warn">educational demo</span>
              </h2>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={keyMode === 'index'}
                  onChange={(event) => setKeyMode(event.target.checked ? 'index' : 'id')}
                />
                <span>Use array index as key (not recommended in real apps)</span>
              </label>
              <p className="panel__text" role="status">
                Current key: <strong>{keyMode === 'index' ? 'array index (the bug)' : 'participant.id (correct)'}</strong>
              </p>
              <ol className="steps">
                <li>Tick the box above (this remounts the tiles and clears the notes).</li>
                <li>Type a different note in each tile, e.g. “Alice note”, “Bob note”.</li>
                <li>Click Remove on the FIRST participant (Alice).</li>
                <li>
                  Bug: Bob’s tile now shows “Alice note”. With index keys React sees
                  key 0 still exists, so it reuses the first tile’s DOM (and the text
                  typed into its uncontrolled input) and only swaps the props.
                </li>
                <li>
                  Untick the box, retype the notes, and remove Alice again. With stable
                  id keys, Bob keeps “Bob note” because React matches tiles by id.
                </li>
              </ol>
              <p className="panel__text">
                The exact result depends on the component structure: the typed text
                lives in the DOM, inside the element React reuses.
              </p>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
