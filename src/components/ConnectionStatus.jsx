// =============================================================================
// src/components/ConnectionStatus.jsx
// =============================================================================
// Shows the right message and buttons for the CURRENT connection status.
// The status is ONE string (see lib/connectionStates.js), so the whole
// component is a single `switch` on that value: one state -> one screen.
// Every case returns something visible, so the user never sees a blank page.
//
// This file exports two things:
//   - StatusBadge (named export): the small coloured pill shown in the header.
//   - ConnectionStatus (default export): the panel/banner for each state.
// =============================================================================

import { CONNECTION_STATUS, STATUS_LABELS } from '../lib/connectionStates.js'

export function StatusBadge({ status }) {
  return (
    <span className={`status-badge status-badge--${status}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      <span className="visually-hidden">Connection status: </span>
      {STATUS_LABELS[status] ?? 'Unknown'}
    </span>
  )
}

export default function ConnectionStatus({
  status,
  participantCount,
  onJoin,
  onConnected,
  onFailed,
  onRetry,
  onBackToIdle,
}) {
  // CONDITIONAL RENDERING with switch: React draws whatever JSX is returned.
  switch (status) {
    case CONNECTION_STATUS.IDLE:
      return (
        <section className="status-card" aria-labelledby="status-title">
          <h2 id="status-title" className="status-card__title">
            Welcome to the meeting room
          </h2>
          <p className="status-card__text">
            You are not in the call yet. Join to see the participants and try the
            controls.
          </p>
          <div className="status-card__actions">
            <button type="button" className="btn btn--primary" onClick={onJoin}>
              Join call
            </button>
          </div>
        </section>
      )

    case CONNECTION_STATUS.CONNECTING:
      return (
        <section className="status-card" aria-labelledby="status-title">
          {/* role="status" makes screen readers announce the message. */}
          <div role="status">
            <span className="spinner" aria-hidden="true" />
            <h2 id="status-title" className="status-card__title">
              Connecting to the call…
            </h2>
            <p className="status-card__text">
              There is no real server, so you decide what happens next:
            </p>
          </div>
          <div className="status-card__actions">
            <button type="button" className="btn btn--primary" onClick={onConnected}>
              Simulate success
            </button>
            <button type="button" className="btn btn--danger" onClick={onFailed}>
              Simulate failure
            </button>
            <button type="button" className="btn btn--ghost" onClick={onBackToIdle}>
              Cancel
            </button>
          </div>
        </section>
      )

    case CONNECTION_STATUS.CONNECTED:
      return (
        <p className="banner banner--connected" role="status">
          You are connected. {participantCount}{' '}
          {participantCount === 1 ? 'participant is' : 'participants are'} in the call.
        </p>
      )

    case CONNECTION_STATUS.RECONNECTING:
      // This is a BANNER, not a full-page screen: the parent keeps the
      // participant grid on screen underneath it.
      return (
        <div className="banner banner--reconnecting" role="alert">
          <div className="banner__message">
            <span className="spinner spinner--small" aria-hidden="true" />
            <strong>Connection lost. Reconnecting…</strong>
            <span> Your participants stay visible while we try again.</span>
          </div>
          <div className="banner__actions">
            <button type="button" className="btn btn--primary btn--small" onClick={onConnected}>
              Simulate reconnected
            </button>
            <button type="button" className="btn btn--danger btn--small" onClick={onFailed}>
              Simulate failure
            </button>
          </div>
        </div>
      )

    case CONNECTION_STATUS.FAILED:
      return (
        <section className="status-card status-card--error" aria-labelledby="status-title">
          <div role="alert">
            <h2 id="status-title" className="status-card__title">
              We couldn’t connect you
            </h2>
            <p className="status-card__text">
              The call could not be reached. Check your internet connection and try
              again.
            </p>
          </div>
          <div className="status-card__actions">
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              Retry
            </button>
            <button type="button" className="btn btn--ghost" onClick={onBackToIdle}>
              Back to start
            </button>
          </div>
        </section>
      )

    default:
      // Safety net: an unknown value still produces a visible message.
      return (
        <p className="banner banner--reconnecting" role="alert">
          Unknown connection status: {String(status)}
        </p>
      )
  }
}
