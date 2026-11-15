import { useEffect, useState } from "react";
import { gatherCandidates } from "../lib/gatherCandidates";

// ICE configurations
const CONFIGS = {
  none: [],
  stun: [{ urls: "stun:stun.l.google.com:19302" }],
  wrong: [{ urls: "stun:stun.invalid.example:3478" }],
};

// Candidate colors
const COLORS = {
  host: "#d5f0ec",
  srflx: "#fdecc8",
  relay: "#fbd9cf",
};

export default function CandidatePanel() {
  const [configName, setConfigName] = useState("stun");
  const [candidates, setCandidates] = useState([]);
  const [elapsed, setElapsed] = useState(null);
  const [gatheringState, setGatheringState] = useState("new");

  const iceServers = CONFIGS[configName];

  useEffect(() => {
    let active = true;

    setCandidates([]);
    setElapsed(null);
    setGatheringState("new");

    const start = performance.now();

    const stop = gatherCandidates({
      iceServers,

      onCandidate: (candidate) => {
        if (!active) return;
        setCandidates((prev) => [...prev, candidate]);
      },

      onDone: () => {
        if (!active) return;
        const end = performance.now();
        setElapsed(Math.round(end - start));
      },

      onStateChange: (state) => {
        if (!active) return;
        setGatheringState(state);
      },
    });

    return () => {
      active = false;
      stop();
    };
  }, [iceServers]);

  const sorted = [...candidates].sort(
    (a, b) => b.priority - a.priority
  );

  return (
    <div style={{ padding: "24px" }}>
      <h1>ICE Candidate Panel</h1>

      <label>ICE Configuration: </label>

      <select
        value={configName}
        onChange={(e) => setConfigName(e.target.value)}
      >
        <option value="none">No STUN</option>
        <option value="stun">Google STUN</option>
        <option value="wrong">Unreachable STUN</option>
      </select>

      <p>Gathering State: {gatheringState}</p>

      <p>
        Gathering Time:{" "}
        {elapsed !== null ? `${elapsed} ms` : "Gathering..."}
      </p>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr>
            <th>Type</th>
            <th>Protocol</th>
            <th>Address : Port</th>
            <th>Priority</th>
            <th>Foundation</th>
          </tr>
        </thead>

        <tbody>
          {sorted.map((c) => (
            <tr
              key={c.candidate}
              style={{
    background: COLORS[c.type] ?? "white",
    color: "#222",
    borderBottom: "1px solid #999",
  }}
>
              <td>{c.type}</td>
              <td>{c.protocol}</td>
              <td>{c.address}:{c.port}</td>
              <td>{c.priority}</td>
              <td>{c.foundation}</td>
            </tr>
          ))}

          {sorted.length === 0 && (
            <tr>
              <td colSpan={5}>Waiting for candidates...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}