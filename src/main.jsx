// =============================================================================
// src/main.jsx - the entry point. index.html loads this file first.
// =============================================================================
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// createRoot tells React: "take control of the <div id="root"> in index.html and
// draw <App /> inside it". From here on React updates the screen; we never edit
// the DOM by hand.
//
// StrictMode is a development-only helper. It renders components twice and runs
// effects mount -> cleanup -> mount to reveal impure code and missing cleanups.
// It has no effect in the production build.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
