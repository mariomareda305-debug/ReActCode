// =============================================================================
// src/components/CameraPreview.jsx   (NEW in the camera update)
// =============================================================================
// Shows a live MediaStream inside a <video> element.
//
// WHY DO WE NEED useRef AND useEffect HERE?
// A MediaStream cannot be passed to <video> as a normal attribute. It must be
// assigned to the DOM property `video.srcObject`. React gives us a safe way to
// reach a real DOM element: a REF.
//   1. useRef(null) creates a box; <video ref={videoRef}> fills it with the
//      actual element after React draws it.
//   2. useEffect runs AFTER drawing, so videoRef.current exists. We assign the
//      stream there. It re-runs whenever `stream` changes.
// This is the sanctioned way to talk to the DOM in React; we still never build
// or edit the interface with querySelector/innerHTML.
// =============================================================================

import { useEffect, useRef } from 'react'

export default function CameraPreview({ stream, label }) {
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined

    video.srcObject = stream
    // Cleanup: detach the stream when it changes or the preview disappears.
    // (Stopping the camera itself is the job of useCamera, which owns it.)
    return () => {
      video.srcObject = null
    }
  }, [stream])

  return (
    // autoPlay: start as soon as frames arrive.
    // muted: required by browsers for autoplay (and avoids echo).
    // playsInline: stops iPhones from forcing full-screen playback.
    // The `camera-video` class mirrors the picture like a mirror/selfie view.
    <video
      ref={videoRef}
      className="camera-video"
      autoPlay
      muted
      playsInline
      aria-label={label}
    />
  )
}
