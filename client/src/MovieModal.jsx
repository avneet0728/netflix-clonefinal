import { useEffect, useState, useRef } from "react";
import axios from "axios";
import YouTube from "react-youtube";
import { useNavigate } from "react-router-dom";

const API_KEY = "33162b70e1fba1766c95372e8ebae858";

export default function MovieModal({ movie, onClose, onAdd, onRemove, isInList }) {
  const [video,       setVideo]       = useState(null);
  const [cast,        setCast]        = useState([]);
  const [genres,      setGenres]      = useState([]);
  const [runtime,     setRuntime]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState("overview"); // "overview" | "watchparty"
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSent,  setInviteSent]  = useState(false);
  const [showInvite,  setShowInvite]  = useState(false);
  const [copied,      setCopied]      = useState(false);
  const roomId = useRef(Math.random().toString(36).substring(7)).current;
  const nav    = useNavigate();

  useEffect(() => {
    if (!movie?.id) return;

    setLoading(true);
    setVideo(null);
    setCast([]);
    setGenres([]);
    setRuntime(null);
    setTab("overview");

    const fetchAll = async () => {
      try {
        const [vidRes, credRes, detRes] = await Promise.all([
          axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${API_KEY}`),
          axios.get(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`),
        ]);

        const vids    = vidRes.data.results || [];
        const trailer =
          vids.find(v => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
          vids.find(v => v.type === "Trailer" && v.site === "YouTube") ||
          vids.find(v => v.type === "Teaser"  && v.site === "YouTube") ||
          vids.find(v => v.site === "YouTube") ||
          null;

        setVideo(trailer);
        setCast((credRes.data.cast  || []).slice(0, 6));
        setGenres((detRes.data.genres || []).slice(0, 4));
        setRuntime(detRes.data.runtime || null);
      } catch (err) {
        console.error("Modal fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [movie?.id]);

  // Close on Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const getRoomUrl = () =>
    `${window.location.origin}/room/${roomId}?video=${video?.key || ""}&title=${encodeURIComponent(movie.title)}`;

  const startParty = () => {
    if (!video?.key) return alert("No trailer available for this title.");
    nav(`/room/${roomId}?video=${video.key}&title=${encodeURIComponent(movie.title)}`);
  };

  const copyLink = () => {
    if (!video?.key) return alert("No trailer available.");
    navigator.clipboard.writeText(getRoomUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim() || !video?.key) return;
    try {
      await axios.post("http://localhost:5002/send-invite", { to: inviteEmail, roomUrl: getRoomUrl() });
      setInviteSent(true);
      setTimeout(() => setInviteSent(false), 3000);
    } catch {
      navigator.clipboard.writeText(getRoomUrl());
      alert("Email failed — room link copied to clipboard.");
    }
  };

  if (!movie) return null;

  const fmtRuntime = (min) => {
    if (!min) return null;
    return `${Math.floor(min / 60)}h ${min % 60}m`;
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        overflowY: "auto",
        display: "flex", justifyContent: "center",
        alignItems: "flex-start", padding: "40px 16px 80px",
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "#181818",
          borderRadius: "8px",
          width: "100%", maxWidth: "900px",
          overflow: "hidden",
          boxShadow: "0 30px 100px rgba(0,0,0,0.95)",
          position: "relative",
          animation: "modalIn 0.2s ease forwards",
        }}
      >
        {/* ── VIDEO / BACKDROP HEADER ── */}
        <div style={{ position: "relative", background: "#000", minHeight: "160px" }}>
          {loading ? (
            <div style={{ height: "420px", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "16px", color: "#888" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #333", borderTop: "3px solid #e50914", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              <span style={{ fontSize: "14px" }}>Loading...</span>
            </div>
          ) : video?.key ? (
            <YouTube
              videoId={video.key}
              opts={{ width: "100%", height: "480", playerVars: { autoplay: 1, modestbranding: 1, rel: 0 } }}
              style={{ display: "block" }}
            />
          ) : (
            /* No trailer — show backdrop */
            <div style={{ height: "380px", position: "relative", overflow: "hidden" }}>
              {movie.backdrop_path
                ? <img src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`} alt={movie.title} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }} />
                : <div style={{ width: "100%", height: "100%", background: "#111" }} />
              }
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#555", fontSize: "15px" }}>No trailer available</span>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "100px", background: "linear-gradient(transparent, #181818)" }} />
            </div>
          )}

          {/* Gradient into content */}
          {video?.key && !loading && (
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "90px", background: "linear-gradient(transparent, #181818)", pointerEvents: "none" }} />
          )}

          {/* Title overlay */}
          {!loading && (
            <div style={{ position: "absolute", bottom: "20px", left: "36px", right: "60px", zIndex: 2 }}>
              <h1 style={{ fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)", fontWeight: 900, textShadow: "2px 2px 10px rgba(0,0,0,0.9)", lineHeight: 1.1 }}>
                {movie.title}
              </h1>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 12, right: 12, zIndex: 10, background: "#181818", color: "white", border: "none", borderRadius: "50%", width: 36, height: 36, fontSize: "18px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >&#215;</button>
        </div>

        {/* ── CONTENT ── */}
        <div style={{ padding: "20px 36px 40px" }}>

          {/* Meta row + actions */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "14px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <span style={{ color: "#46d369", fontWeight: 700, fontSize: "15px" }}>
                {Math.round(movie.vote_average * 10)}% Match
              </span>
              <span style={{ color: "#ddd", fontSize: "14px" }}>{movie.release_date?.substring(0, 4)}</span>
              {fmtRuntime(runtime) && (
                <span style={{ color: "#ddd", fontSize: "14px" }}>{fmtRuntime(runtime)}</span>
              )}
              <span style={{ border: "1px solid #777", color: "#aaa", padding: "1px 6px", fontSize: "12px", borderRadius: "2px" }}>HD</span>
              {genres.map(g => (
                <span key={g.id} style={{ background: "rgba(255,255,255,0.07)", color: "#ccc", padding: "3px 10px", borderRadius: "12px", fontSize: "12px" }}>{g.name}</span>
              ))}
            </div>

            {/* Add/Remove My List */}
            <button
              onClick={() => isInList ? onRemove(movie) : onAdd(movie)}
              style={{
                background: isInList ? "rgba(229,9,20,0.2)" : "rgba(255,255,255,0.08)",
                color: isInList ? "#e50914" : "white",
                border: `1px solid ${isInList ? "#e50914" : "#777"}`,
                padding: "8px 20px", borderRadius: "4px", cursor: "pointer",
                fontWeight: 700, fontSize: "14px", whiteSpace: "nowrap",
                transition: "all 0.2s",
              }}
            >
              {isInList ? "✓ In My List" : "+ My List"}
            </button>
          </div>

          {/* Tab buttons */}
          <div style={{ display: "flex", gap: "0", marginBottom: "24px", borderBottom: "1px solid #2a2a2a" }}>
            {["overview", "watchparty"].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  background: "none", border: "none", color: tab === t ? "white" : "#777",
                  padding: "10px 20px", fontSize: "14px", fontWeight: tab === t ? 700 : 500,
                  cursor: "pointer", borderBottom: tab === t ? "2px solid #e50914" : "2px solid transparent",
                  transition: "all 0.2s", textTransform: "capitalize",
                  fontFamily: "inherit",
                }}
              >
                {t === "watchparty" ? "Watch Party" : "Overview"}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW TAB ── */}
          {tab === "overview" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: "36px" }}>
              <div>
                <p style={{ color: "#d2d2d2", lineHeight: 1.75, fontSize: "15px", marginBottom: "24px" }}>
                  {movie.overview || "No description available."}
                </p>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {video?.key && (
                    <button
                      onClick={() => { const rid = Math.random().toString(36).substring(7); nav(`/room/${rid}?video=${video.key}&title=${encodeURIComponent(movie.title)}`); }}
                      style={{ background: "white", color: "black", border: "none", padding: "10px 24px", borderRadius: "4px", fontWeight: 700, fontSize: "15px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
                    >
                      &#9654; Play Trailer
                    </button>
                  )}
                  <button
                    onClick={() => setTab("watchparty")}
                    style={{ background: "rgba(229,9,20,0.15)", color: "#e50914", border: "1px solid rgba(229,9,20,0.4)", padding: "10px 20px", borderRadius: "4px", fontWeight: 700, fontSize: "15px", cursor: "pointer" }}
                  >
                    Watch Party
                  </button>
                </div>
              </div>

              {/* Right column — details */}
              <div style={{ fontSize: "13px", lineHeight: 2 }}>
                {cast.length > 0 && (
                  <p style={{ color: "#777", marginBottom: "6px" }}>
                    <span>Cast: </span>
                    <span style={{ color: "#d2d2d2" }}>{cast.map(c => c.name).join(", ")}</span>
                  </p>
                )}
                <p style={{ color: "#777", marginBottom: "6px" }}>
                  <span>Rating: </span>
                  <span style={{ color: "#d2d2d2" }}>&#9733; {movie.vote_average?.toFixed(1)} ({movie.vote_count?.toLocaleString()} votes)</span>
                </p>
                <p style={{ color: "#777", marginBottom: "6px" }}>
                  <span>Release: </span>
                  <span style={{ color: "#d2d2d2" }}>{movie.release_date}</span>
                </p>
                <p style={{ color: "#777", marginBottom: "6px" }}>
                  <span>Language: </span>
                  <span style={{ color: "#d2d2d2" }}>{movie.original_language?.toUpperCase()}</span>
                </p>
                {runtime && (
                  <p style={{ color: "#777" }}>
                    <span>Runtime: </span>
                    <span style={{ color: "#d2d2d2" }}>{fmtRuntime(runtime)}</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── WATCH PARTY TAB ── */}
          {tab === "watchparty" && (
            <div>
              <div style={{ background: "rgba(229,9,20,0.07)", border: "1px solid rgba(229,9,20,0.25)", borderRadius: "8px", padding: "28px 28px 24px" }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: "8px", color: "#e50914" }}>
                  Watch Party
                </h3>
                <p style={{ color: "#999", fontSize: "14px", lineHeight: 1.6, marginBottom: "22px" }}>
                  {video?.key
                    ? "Watch this trailer in real-time sync with a friend. Create a room, share the link — both players stay perfectly in sync."
                    : "No trailer available for this title. Watch Party is unavailable."}
                </p>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: showInvite ? "16px" : "0" }}>
                  <button
                    onClick={startParty}
                    disabled={!video?.key}
                    style={{ background: video?.key ? "#e50914" : "#444", color: "white", border: "none", padding: "10px 22px", borderRadius: "4px", fontWeight: 700, fontSize: "14px", cursor: video?.key ? "pointer" : "not-allowed", opacity: video?.key ? 1 : 0.5 }}
                  >
                    Start Party
                  </button>
                  <button
                    onClick={copyLink}
                    disabled={!video?.key}
                    style={{ background: copied ? "rgba(70,211,105,0.15)" : "rgba(255,255,255,0.07)", color: copied ? "#46d369" : "white", border: `1px solid ${copied ? "#46d369" : "#555"}`, padding: "10px 20px", borderRadius: "4px", fontSize: "14px", cursor: video?.key ? "pointer" : "not-allowed", opacity: video?.key ? 1 : 0.5, fontWeight: 600, transition: "all 0.25s" }}
                  >
                    {copied ? "Link Copied!" : "Copy Room Link"}
                  </button>
                  <button
                    onClick={() => setShowInvite(v => !v)}
                    disabled={!video?.key}
                    style={{ background: "rgba(255,255,255,0.07)", color: "white", border: "1px solid #555", padding: "10px 20px", borderRadius: "4px", fontSize: "14px", cursor: video?.key ? "pointer" : "not-allowed", opacity: video?.key ? 1 : 0.5 }}
                  >
                    Invite by Email
                  </button>
                </div>

                {showInvite && video?.key && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <input
                      type="email"
                      placeholder="friend@example.com"
                      value={inviteEmail}
                      onChange={e => setInviteEmail(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && sendInvite()}
                      style={{ flex: 1, background: "#111", color: "white", border: "1px solid #333", padding: "9px 14px", borderRadius: "4px", fontSize: "14px", outline: "none" }}
                    />
                    <button
                      onClick={sendInvite}
                      style={{ background: inviteSent ? "#46d369" : "#e50914", color: "white", border: "none", padding: "9px 20px", borderRadius: "4px", fontWeight: 700, fontSize: "14px", cursor: "pointer", transition: "background 0.3s", whiteSpace: "nowrap" }}
                    >
                      {inviteSent ? "Sent!" : "Send Invite"}
                    </button>
                  </div>
                )}

                {video?.key && (
                  <div style={{ marginTop: "16px", background: "rgba(0,0,0,0.35)", borderRadius: "4px", padding: "9px 14px", display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ color: "#555", fontSize: "11px", flexShrink: 0 }}>Room link:</span>
                    <span style={{ color: "#777", fontSize: "11px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{getRoomUrl()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes modalIn { from { opacity:0; transform:scale(0.96) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes spin    { to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
