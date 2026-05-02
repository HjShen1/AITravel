import { useState } from "react";

interface Activity {
  time: string;
  title: string;
  description: string;
  location: string;
}

interface Day {
  day: number;
  activities: Activity[];
}

interface Itinerary {
  days: Day[];
}

const PIN = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="5" cy="4" r="2" />
    <path d="M5 9C5 9 2 6.5 2 4a3 3 0 016 0c0 2.5-3 5-3 5z" />
  </svg>
);

const VIBES = ["Culture", "Food & Drink", "Nature", "Nightlife", "Shopping", "Off the beaten path"];

function ActivityCard({ act, index }: { act: Activity; index: number }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: "1px solid rgba(26,23,20,0.09)",
        borderRadius: 2,
        padding: "22px 26px",
        display: "grid",
        gridTemplateColumns: "80px 1fr",
        gap: 20,
        alignItems: "start",
        boxShadow: hovered ? "0 4px 20px rgba(26,23,20,0.08)" : "none",
        transform: hovered ? "translateY(-1px)" : "none",
        transition: "box-shadow 0.2s, transform 0.2s",
        animation: `slideIn 0.4s ease-out ${index * 0.1}s both`,
      }}
    >
      <div style={{ textAlign: "right", paddingTop: 3 }}>
        <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8a8279" }}>
          {act.time}
        </div>
      </div>
      <div>
        <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 21, fontWeight: 400, color: "#1a1714", lineHeight: 1.2, marginBottom: 8 }}>
          {act.title}
        </div>
        <div style={{ fontSize: 13, fontWeight: 300, color: "#8a8279", lineHeight: 1.65, marginBottom: 14 }}>
          {act.description}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#2d4a3e", display: "flex", alignItems: "center", gap: 5, fontWeight: 400 }}>
            <PIN /> {act.location}
          </span>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [city, setCity] = useState("Paris");
  const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
  const [customQuery, setCustomQuery] = useState("");
  const [days, setDays] = useState(2);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);

  const toggleVibe = (vibe: string) => {
    setSelectedVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const buildQuery = () => {
    const parts = [...selectedVibes];
    if (customQuery.trim()) parts.push(customQuery.trim());
    return parts.join(", ") || "travel";
  };

  const generateTrip = () => {
    setOutput("");
    setItinerary(null);
    setLoading(true);

    const query = buildQuery();
    const apiBase = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
    const url = `${apiBase}/api/stream/?query=${encodeURIComponent(query)}&city=${encodeURIComponent(city)}&days=${days}`;
    const source = new EventSource(url);

    source.onmessage = (event) => {
      if (event.data === "[DONE]") {
        source.close();
        setLoading(false);
        setOutput((accumulated) => {
          try {
            const parsed = JSON.parse(accumulated);
            setItinerary(parsed);
          } catch {
            // fall back to raw text
          }
          return accumulated;
        });
        return;
      }
      if (event.data === "[ERROR]") {
        source.close();
        setLoading(false);
        setOutput("Something went wrong, please try again.");
        return;
      }
      setOutput((prev) => prev + event.data);
    };
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#f7f4ef", minHeight: "100vh", padding: "0 0 80px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&display=swap');
        @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes blink { 50% { opacity:0; } }
        @keyframes pulse { 0%,80%,100%{opacity:.3;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
        * { box-sizing:border-box; }
        input:focus { outline: none; border-color: #2d4a3e !important; }
        input::placeholder { color: #c4bdb5; }
      `}</style>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <header style={{ padding: "52px 0 48px", textAlign: "center", borderBottom: "1px solid rgba(200,169,126,0.3)" }}>
          <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 16 }}>
            AI-Powered
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 54, fontWeight: 300, lineHeight: 1.05, color: "#1a1714", margin: 0 }}>
            Plan your next{" "}
            <em style={{ fontStyle: "italic", color: "#2d4a3e" }}>journey</em>
          </h1>
          <p style={{ marginTop: 14, fontSize: 14, color: "#8a8279", fontWeight: 300 }}>
            Curated itineraries, crafted by intelligence
          </p>
        </header>

        {/* Input panel */}
        <div style={{ marginTop: 44, background: "#fff", border: "1px solid rgba(26,23,20,0.09)", borderRadius: 2, padding: "32px 36px", boxShadow: "0 2px 24px rgba(26,23,20,0.05)" }}>

          {/* Destination + Days row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 26 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a8279" }}>
                Destination
              </label>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Paris, Tokyo…"
                style={{
                  fontFamily: "inherit", fontSize: 15, fontWeight: 300, color: "#1a1714",
                  background: "#f7f4ef", border: "1px solid rgba(26,23,20,0.1)", borderRadius: 2,
                  padding: "12px 15px", width: "100%", transition: "border-color 0.15s",
                }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a8279" }}>
                Duration
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDays(d)}
                    style={{
                      flex: 1,
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 400,
                      padding: "11px 0",
                      borderRadius: 2,
                      border: days === d ? "1.5px solid #2d4a3e" : "1px solid rgba(26,23,20,0.12)",
                      background: days === d ? "#2d4a3e" : "#f7f4ef",
                      color: days === d ? "#f7f4ef" : "#8a8279",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {d}d
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Vibe chips */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a8279", display: "block", marginBottom: 10 }}>
              What are you looking for?
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {VIBES.map((vibe) => {
                const active = selectedVibes.includes(vibe);
                return (
                  <button
                    key={vibe}
                    onClick={() => toggleVibe(vibe)}
                    style={{
                      fontFamily: "inherit",
                      fontSize: 13,
                      fontWeight: 400,
                      padding: "8px 16px",
                      borderRadius: 20,
                      border: active ? "1.5px solid #2d4a3e" : "1px solid rgba(26,23,20,0.15)",
                      background: active ? "rgba(45,74,62,0.08)" : "#f7f4ef",
                      color: active ? "#2d4a3e" : "#8a8279",
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                  >
                    {vibe}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom query */}
          <div style={{ marginBottom: 22 }}>
            <input
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              placeholder="Or describe what you're looking for…"
              style={{
                fontFamily: "inherit", fontSize: 14, fontWeight: 300, color: "#1a1714",
                background: "#f7f4ef", border: "1px solid rgba(26,23,20,0.1)", borderRadius: 2,
                padding: "11px 15px", width: "100%", transition: "border-color 0.15s",
              }}
            />
          </div>

          <button
            onClick={generateTrip}
            disabled={loading}
            style={{
              width: "100%", fontFamily: "inherit", fontSize: 13, fontWeight: 500,
              letterSpacing: "0.1em", textTransform: "uppercase",
              color: "#f7f4ef", background: loading ? "#7a9e93" : "#2d4a3e",
              border: "none", borderRadius: 2, padding: 16,
              cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            }}
          >
            {loading ? (
              <>
                Crafting your journey
                <span style={{ display: "flex", gap: 4 }}>
                  {[0, 0.2, 0.4].map((d, i) => (
                    <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#f7f4ef", display: "inline-block", animation: `pulse 1.2s ease-in-out ${d}s infinite` }} />
                  ))}
                </span>
              </>
            ) : "Generate Itinerary"}
          </button>
        </div>

        {/* Streaming: single-line ticker */}
        {loading && (
          <div style={{ marginTop: 44 }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a8279", marginBottom: 10, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2d4a3e", display: "inline-block", animation: "pulse 1.2s ease-in-out infinite" }} />
              Generating your itinerary
            </div>
            <div style={{
              background: "#eee8df",
              borderRadius: 2,
              padding: "14px 20px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              fontFamily: "'DM Mono', 'Courier New', monospace",
              fontSize: 13,
              color: "#6b6257",
              display: "flex",
              alignItems: "center",
              gap: 10,
              border: "1px solid rgba(26,23,20,0.08)",
            }}>
              <span style={{ color: "#2d4a3e", flexShrink: 0 }}>›</span>
              <span style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                direction: "rtl",
                textAlign: "left",
              }}>
                {output || " "}
              </span>
              <span style={{ width: 2, height: "1em", background: "#8a8279", flexShrink: 0, animation: "blink 0.8s step-end infinite" }} />
            </div>
          </div>
        )}

        {/* Itinerary panels */}
        {!loading && itinerary && (
          <div style={{ marginTop: 48 }}>
            <div style={{ paddingBottom: 18, marginBottom: 28, borderBottom: "1px solid rgba(26,23,20,0.09)" }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 36, fontWeight: 300, color: "#1a1714", margin: 0 }}>
                Your trip to{" "}
                <em style={{ fontStyle: "italic", color: "#c8a97e" }}>{city}</em>
              </h2>
            </div>

            {itinerary.days.map((day, di) => (
              <div key={day.day} style={{ marginBottom: 44 }}>
                <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c8a97e", marginBottom: 18, display: "flex", alignItems: "center", gap: 12 }}>
                  Day {day.day}
                  <span style={{ flex: 1, height: 1, background: "#e8ddd0", display: "block" }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                  {day.activities.map((act, ai) => (
                    <div key={ai} style={{ display: "grid", gridTemplateColumns: "40px 1fr", gap: 0 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 26 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e8ddd0", border: "1.5px solid #c8a97e", flexShrink: 0 }} />
                        {ai < day.activities.length - 1 && (
                          <div style={{ width: 1, flex: 1, background: "#e8ddd0", marginTop: 4 }} />
                        )}
                      </div>
                      <div style={{ paddingBottom: ai < day.activities.length - 1 ? 10 : 0 }}>
                        <ActivityCard act={act} index={ai} />
                      </div>
                    </div>
                  ))}
                </div>
                {di < itinerary.days.length - 1 && (
                  <div style={{ width: 1, height: 24, background: "#e8ddd0", margin: "28px 0 0 40px" }} />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Fallback raw text */}
        {!loading && !itinerary && output && (
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 24, padding: 20, background: "#fff", border: "1px solid rgba(26,23,20,0.09)", fontSize: 14, color: "#1a1714", lineHeight: 1.7 }}>
            {output}
          </pre>
        )}
      </div>
    </div>
  );
}

export default App;
