// =============================================================================
// src/hooks/useCamera.js   (NEW in the camera update)
// =============================================================================
// A custom hook that owns everything about the user's camera:
//   - asking the browser for permission (navigator.mediaDevices.getUserMedia)
//   - keeping the resulting MediaStream
//   - stopping it (turning the camera light off) when we no longer need it
//
// Like the connection status, the camera is a SMALL STATE MACHINE with ONE
// status string instead of several Booleans:
//   off          - camera not started
//   requesting   - waiting for the user to click "Allow" in the browser prompt
//   on           - we have a live stream
//   denied       - the user clicked "Block" (or blocked it in browser settings)
//   unavailable  - no camera found, or the browser/page cannot use cameras
//   error        - anything else went wrong
//
// IMPORTANT BROWSER RULES
//  * getUserMedia only works on https:// pages or on http://localhost.
//  * The browser ALWAYS asks the user for permission; code cannot skip it.
//  * A MediaStream keeps the camera running until every track is .stop()ped.
//    Forgetting that leaves the camera light on - the same kind of "leak" as an
//    interval that is never cleared.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react'

export const CAMERA_STATUS = Object.freeze({
  OFF: 'off',
  REQUESTING: 'requesting',
  ON: 'on',
  DENIED: 'denied',
  UNAVAILABLE: 'unavailable',
  ERROR: 'error',
})

// Turns the browser's error object into a status plus a friendly message.
// Pure function (no React), so it could live in lib/ and be unit-tested.
function describeCameraError(error) {
  switch (error?.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return {
        status: CAMERA_STATUS.DENIED,
        message:
          'Camera permission was blocked. Click the camera/lock icon in the address bar, allow the camera, then try again.',
      }
    case 'NotFoundError':
    case 'OverconstrainedError':
      return {
        status: CAMERA_STATUS.UNAVAILABLE,
        message: 'No camera was found on this device.',
      }
    case 'NotReadableError':
    case 'AbortError':
      return {
        status: CAMERA_STATUS.ERROR,
        message: 'The camera is busy. Close other apps that use it and try again.',
      }
    default:
      return {
        status: CAMERA_STATUS.ERROR,
        message: 'Something went wrong while starting the camera.',
      }
  }
}

export function useCamera() {
  const [status, setStatus] = useState(CAMERA_STATUS.OFF)
  const [stream, setStream] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  // A REF is a box ({ current: ... }) that React keeps between renders but that
  // does NOT cause a re-render when changed. We use refs for two things that
  // are "bookkeeping" rather than something to draw:
  //   streamRef  - the live stream, so cleanup always sees the latest one
  //   requestRef - a counter used to ignore outdated permission answers
  const streamRef = useRef(null)
  const requestRef = useRef(0)

  // Stops every track of the current stream (this switches the camera off).
  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const stop = useCallback(() => {
    requestRef.current += 1 // any answer still pending is now outdated
    releaseStream()
    setStream(null)
    setErrorMessage('')
    setStatus(CAMERA_STATUS.OFF)
  }, [releaseStream])

  const start = useCallback(async () => {
    // Older browsers, and pages served over plain http, have no mediaDevices.
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage(
        'This browser or page cannot use the camera. Use https:// or http://localhost in a modern browser.',
      )
      setStatus(CAMERA_STATUS.UNAVAILABLE)
      return
    }

    const requestId = ++requestRef.current
    setStatus(CAMERA_STATUS.REQUESTING)
    setErrorMessage('')

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false, // this lab only needs video
      })

      // While the user was reading the permission prompt, they may have clicked
      // Stop or left the call. If so, throw the new stream away immediately.
      if (requestId !== requestRef.current) {
        newStream.getTracks().forEach((track) => track.stop())
        return
      }

      releaseStream() // safety: never keep two streams alive
      streamRef.current = newStream
      setStream(newStream)
      setStatus(CAMERA_STATUS.ON)
    } catch (error) {
      if (requestId !== requestRef.current) return
      const { status: nextStatus, message } = describeCameraError(error)
      setErrorMessage(message)
      setStatus(nextStatus)
    }
  }, [releaseStream])

  // CLEANUP ON UNMOUNT: an effect with an empty dependency array runs once, and
  // the function it returns runs when the component using this hook disappears.
  // That guarantees the camera is released even if the user closes the page
  // section without pressing Stop.
  useEffect(() => {
    return () => {
      requestRef.current += 1
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [])

  return { status, stream, errorMessage, start, stop }
}
