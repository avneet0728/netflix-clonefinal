import { useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_KEY = "33162b70e1fba1766c95372e8ebae858";

export default function MovieRow({ title, movies, onSelect, isInList, onRemove }) {
  const [hovered,  setHovered]  = useState(null);
  const [hoverPos, setHoverPos] = useState(0);
  const hoverTimer = useRef(null);
  const leaveTimer = useRef(null);
  const rowRef     = useRef(null);
  const nav        = useNavigate();

  if (!movies || movies.length === 0) return null;

  const scroll = (dir) => rowRef.current?.scrollBy({ left: dir * 480, behavior: "smooth" });

  const onCardEnter = (m, e) => {
    clearTimeout(leaveTimer.current);
    clearTimeout(hoverTimer.current);
    const cardRect = e.currentTarget.getBoundingClientRect();
    const rowRect  = rowRef.current?.getBoundingClientRect();
    const relLeft  = cardRect.left - (rowRect?.left || 0);
    hoverTimer.current = setTimeout(() => {
      setHoverPos(relLeft);
      setHovered(m);
    }, 400);
  };

  const onCardLeave = () => {
    clearTimeout(hoverTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(null), 300);
  };

  const playTrailer = async (m, e) => {
    e.stopPropagation();
    try {
      const res     = await axios.get(`https://api.themoviedb.org/3/movie/${m.id}/videos?api_key=${API_KEY}`);
      const results = res.data.results;
      const trailer =
        results.find(v => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
        results.find(v => v.type === "Trailer" && v.site === "YouTube") ||
        results.find(v => v.type === "Teaser"  && v.site === "YouTube") ||
        results.find(v => v.site === "YouTube");
      if (!trailer?.key) return alert("No trailer available for this movie.");
      const roomId = Math.random().toString(36).substring(7);
      nav(`/room/${roomId}?video=${trailer.key}&title=${encodeURIComponent(m.title)}`);
    } catch {
      alert("Error loading trailer.");
    }
  };

  const rowWidth = rowRef.current?.offsetWidth || 1000;
  const cardW    = 160;
  const popupW   = 280;
  const clampedLeft = Math.max(0, Math.min(hoverPos - 20, rowWidth - popupW - 8));

  return (
    <div style={{ marginBottom: "40px", position: "relative" }}>
      {/* Row title */}
      <h2 style={{
        fontSize: "1.1rem", fontWeight: 700, color: "#e5e5e5",
        marginBottom: "10px", paddingLeft: "2px", letterSpacing: "0.02em",
      }}>
        {title}
      </h2>

      <div style={{ position: "relative" }}>
        {/* Left arrow */}
        <button
          onClick={() => scroll(-1)}
          style={arrowBtn("left")}
          onMouseOver={e  => e.currentTarget.style.background = "rgba(20,20,20,1)"}
          onMouseOut={e   => e.currentTarget.style.background = "rgba(20,20,20,0.7)"}
        >&#8249;</button>

        {/* Right arrow */}
        <button
          onClick={() => scroll(1)}
          style={arrowBtn("right")}
          onMouseOver={e  => e.currentTarget.style.background = "rgba(20,20,20,1)"}
          onMouseOut={e   => e.currentTarget.style.background = "rgba(20,20,20,0.7)"}
        >&#8250;</button>

        {/* Cards row */}
        <div
          ref={rowRef}
          style={{
            display: "flex", flexDirection: "row", flexWrap: "nowrap",
            gap: "4px", overflowX: "auto", overflowY: "visible",
            padding: "16px 2px 20px", scrollBehavior: "smooth",
            msOverflowStyle: "none", scrollbarWidth: "none",
          }}
        >
          {movies.map(m => (
            <div
              key={m.id}
              onMouseEnter={e  => onCardEnter(m, e)}
              onMouseLeave={onCardLeave}
              onClick={() => onSelect(m)}
              style={{
                flexShrink: 0, width: `${cardW}px`, cursor: "pointer",
                borderRadius: "4px", overflow: "hidden", position: "relative",
                transition: "transform 0.2s ease",
                transform: hovered?.id === m.id ? "scale(1.05)" : "scale(1)",
              }}
            >
              {m.poster_path
                ? <img src={`https://image.tmdb.org/t/p/w300${m.poster_path}`} alt={m.title} loading="lazy" style={{ width: `${cardW}px`, height: "240px", objectFit: "cover", display: "block" }} />
                : <div style={{ width: `${cardW}px`, height: "240px", background: "#2a2a2a", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", color: "#888", padding: "8px", textAlign: "center" }}>{m.title}</div>
              }
              {onRemove && (
                <button
                  onClick={e => { e.stopPropagation(); onRemove(m); }}
                  style={{ position: "absolute", top: 6, right: 6, background: "rgba(0,0,0,0.8)", color: "white", border: "none", borderRadius: "50%", width: 22, height: 22, cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
                >&#215;</button>
              )}
            </div>
          ))}
        </div>

        {/* Hover popup card */}
        {hovered && (
          <div
            onMouseEnter={() => clearTimeout(leaveTimer.current)}
            onMouseLeave={onCardLeave}
            onClick={e => e.stopPropagation()}
            style={{
              position: "absolute",
              left: clampedLeft,
              top: 0,
              width: `${popupW}px`,
              background: "#181818",
              borderRadius: "8px",
              boxShadow: "0 12px 48px rgba(0,0,0,0.9)",
              zIndex: 400,
              overflow: "hidden",
              animation: "popIn 0.15s ease forwards",
              transformOrigin: "top center",
            }}
          >
            {/* Backdrop */}
            <div style={{ height: "155px", overflow: "hidden", position: "relative", background: "#000" }}>
              <img
                src={`https://image.tmdb.org/t/p/w500${hovered.backdrop_path || hovered.poster_path}`}
                alt={hovered.title}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.9 }}
              />
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60px", background: "linear-gradient(transparent, #181818)" }} />
            </div>

            {/* Info */}
            <div style={{ padding: "12px 14px 16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: 700, marginBottom: "7px", lineHeight: 1.3 }}>
                {hovered.title}
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "8px", flexWrap: "wrap" }}>
                <span style={{ color: "#46d369", fontWeight: 700, fontSize: "13px" }}>
                  {Math.round(hovered.vote_average * 10)}% Match
                </span>
                <span style={{ color: "#ddd", fontSize: "12px" }}>
                  {hovered.vote_average?.toFixed(1)} / 10
                </span>
                <span style={{ border: "1px solid #777", color: "#999", padding: "0 5px", fontSize: "11px", borderRadius: "2px" }}>HD</span>
                <span style={{ color: "#999", fontSize: "12px" }}>{hovered.release_date?.substring(0, 4)}</span>
              </div>
              <p style={{
                fontSize: "12px", color: "#bbb", lineHeight: 1.55, marginBottom: "12px",
                display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
              }}>
                {hovered.overview || "No description available."}
              </p>
              <div style={{ display: "flex", gap: "6px" }}>
                <button
                  onClick={e => playTrailer(hovered, e)}
                  style={{ flex: 1, background: "white", color: "black", border: "none", padding: "7px", borderRadius: "4px", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  &#9654; Trailer
                </button>
                <button
                  onClick={() => { onSelect(hovered); setHovered(null); }}
                  style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid #555", padding: "7px 11px", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                  title="More Info"
                >
                  &#8505;
                </button>
                <button
                  onClick={e => { e.stopPropagation(); isInList(hovered) ? null : null; onSelect(hovered); setHovered(null); }}
                  style={{ background: isInList(hovered) ? "rgba(229,9,20,0.3)" : "rgba(255,255,255,0.1)", color: "white", border: "1px solid #555", padding: "7px 10px", borderRadius: "4px", cursor: "pointer", fontSize: "13px" }}
                  title={isInList(hovered) ? "In My List" : "Add to List"}
                >
                  {isInList(hovered) ? "✓" : "+"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.92) translateY(8px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
        div[style*="overflow-x: auto"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

const arrowBtn = (side) => ({
  position: "absolute",
  [side]: 0,
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 50,
  background: "rgba(20,20,20,0.7)",
  color: "white",
  border: "none",
  width: "40px",
  height: "72px",
  fontSize: "2.2rem",
  cursor: "pointer",
  borderRadius: side === "left" ? "0 4px 4px 0" : "4px 0 0 4px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background 0.2s",
  backdropFilter: "blur(2px)",
});
