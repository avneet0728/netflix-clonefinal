import { useEffect, useState } from "react";
import axios from "axios";
import MovieRow from "./MovieRow";
import MovieModal from "./MovieModal";

const API_KEY = "33162b70e1fba1766c95372e8ebae858";

export default function Home({ user, onLogout }) {
  const [trending,      setTrending]      = useState([]);
  const [action,        setAction]        = useState([]);
  const [comedy,        setComedy]        = useState([]);
  const [scifi,         setScifi]         = useState([]);
  const [horror,        setHorror]        = useState([]);
  const [romance,       setRomance]       = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [myList,        setMyList]        = useState(JSON.parse(localStorage.getItem("myList") || "[]"));
  const [search,        setSearch]        = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hero,          setHero]          = useState(null);
  const [scrolled,      setScrolled]      = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const load = async () => {
      const [t, a, c, s, h, r] = await Promise.all([
        axios.get(`https://api.themoviedb.org/3/trending/movie/week?api_key=${API_KEY}`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=28&sort_by=popularity.desc`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=35&sort_by=popularity.desc`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=878&sort_by=popularity.desc`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=27&sort_by=popularity.desc`),
        axios.get(`https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=10749&sort_by=popularity.desc`),
      ]);
      setTrending(t.data.results);
      setAction(a.data.results);
      setComedy(c.data.results);
      setScifi(s.data.results);
      setHorror(h.data.results);
      setRomance(r.data.results);
      setHero(t.data.results[Math.floor(Math.random() * 5)]);
    };
    load();
  }, []);

  const handleSearch = async (e) => {
    const q = e.target.value;
    setSearch(q);
    if (!q) return setSearchResults([]);
    const res = await axios.get(`https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}`);
    setSearchResults(res.data.results.filter(m => m.poster_path));
  };

  const addToList    = (m) => {
    if (myList.find(x => x.id === m.id)) return;
    const updated = [...myList, m];
    setMyList(updated);
    localStorage.setItem("myList", JSON.stringify(updated));
  };
  const removeFromList = (m) => {
    const updated = myList.filter(x => x.id !== m.id);
    setMyList(updated);
    localStorage.setItem("myList", JSON.stringify(updated));
  };
  const isInList = (m) => myList.some(x => x.id === m.id);

  return (
    <div style={{ background: "#141414", minHeight: "100vh", color: "white", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* ── NAVBAR ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 200,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "0 48px", height: "68px",
        background: scrolled ? "#141414" : "linear-gradient(to bottom, rgba(0,0,0,0.9) 0%, transparent 100%)",
        transition: "background 0.4s",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <span style={{ color: "#e50914", fontSize: "1.9rem", fontWeight: 900, letterSpacing: "-1px", cursor: "pointer" }}>NETFLIX</span>
          <div style={{ display: "flex", gap: "18px" }}>
            {["Home", "TV Shows", "Movies", "New & Popular", "My List"].map(item => (
              <span key={item} style={{ color: "#e5e5e5", fontSize: "14px", cursor: "pointer", opacity: 0.85 }}
                onMouseOver={e => e.target.style.opacity = 1}
                onMouseOut={e => e.target.style.opacity = 0.85}
              >{item}</span>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {/* Search */}
          <div style={{ position: "relative" }}>
            <input
              placeholder="Search titles, people..."
              value={search}
              onChange={handleSearch}
              style={{
                background: "rgba(0,0,0,0.75)", border: "1px solid rgba(255,255,255,0.5)",
                color: "white", padding: "6px 14px 6px 36px",
                borderRadius: "4px", width: "220px", fontSize: "14px", outline: "none",
              }}
            />
            <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#aaa", fontSize: "14px", pointerEvents: "none" }}>
              &#128269;
            </span>
          </div>

          {user?.name && (
            <span style={{ color: "#e5e5e5", fontSize: "14px" }}>
              {user.name.split(" ")[0]}
            </span>
          )}
          <div style={{
            width: 34, height: 34, borderRadius: "4px", background: "#e50914",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: "14px", cursor: "pointer",
          }}>
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <span
            onClick={onLogout}
            style={{ color: "#b3b3b3", fontSize: "13px", cursor: "pointer" }}
            onMouseOver={e => e.target.style.color = "white"}
            onMouseOut={e => e.target.style.color = "#b3b3b3"}
          >
            Sign Out
          </span>
        </div>
      </nav>

      {/* ── HERO BANNER ── */}
      {!search && hero && (
        <div style={{
          position: "relative", height: "90vh",
          backgroundImage: `url(https://image.tmdb.org/t/p/original${hero.backdrop_path})`,
          backgroundSize: "cover", backgroundPosition: "center top",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.8) 35%, rgba(0,0,0,0.1) 70%, transparent 100%)" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, #141414 0%, transparent 50%)" }} />

          <div style={{ position: "relative", zIndex: 2, padding: "0 60px", paddingTop: "260px", maxWidth: "580px" }}>
            <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, lineHeight: 1.1, marginBottom: "18px", textShadow: "2px 2px 12px rgba(0,0,0,0.7)" }}>
              {hero.title}
            </h1>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px", fontSize: "14px" }}>
              <span style={{ color: "#46d369", fontWeight: 700, fontSize: "15px" }}>{Math.round(hero.vote_average * 10)}% Match</span>
              <span style={{ color: "#ddd" }}>{hero.release_date?.substring(0, 4)}</span>
              <span style={{ border: "1px solid #ccc", color: "#ccc", padding: "1px 6px", fontSize: "12px", borderRadius: "2px" }}>HD</span>
            </div>
            <p style={{ color: "#ddd", fontSize: "15px", lineHeight: 1.65, marginBottom: "28px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {hero.overview}
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setSelected(hero)}
                style={{ background: "white", color: "black", border: "none", padding: "11px 28px", borderRadius: "4px", fontWeight: 700, fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                &#9654; Play
              </button>
              <button
                onClick={() => setSelected(hero)}
                style={{ background: "rgba(109,109,110,0.7)", color: "white", border: "none", padding: "11px 28px", borderRadius: "4px", fontWeight: 700, fontSize: "16px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px" }}
              >
                &#9432; More Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ROWS ── */}
      <div style={{ padding: "0 48px", marginTop: search ? "88px" : "-120px", position: "relative", zIndex: 10 }}>
        {search && searchResults.length > 0 ? (
          <MovieRow title={`Results for "${search}"`} movies={searchResults} onSelect={setSelected} isInList={isInList} />
        ) : search && searchResults.length === 0 && search.length > 1 ? (
          <div style={{ textAlign: "center", paddingTop: "80px", color: "#aaa", fontSize: "18px" }}>No results found for "{search}"</div>
        ) : (
          <>
            <MovieRow title="Trending Now"   movies={trending} onSelect={setSelected} isInList={isInList} />
            <MovieRow title="Action"         movies={action}   onSelect={setSelected} isInList={isInList} />
            <MovieRow title="Comedy"         movies={comedy}   onSelect={setSelected} isInList={isInList} />
            <MovieRow title="Sci-Fi"         movies={scifi}    onSelect={setSelected} isInList={isInList} />
            <MovieRow title="Horror"         movies={horror}   onSelect={setSelected} isInList={isInList} />
            <MovieRow title="Romance"        movies={romance}  onSelect={setSelected} isInList={isInList} />
            {myList.length > 0 && (
              <MovieRow title="My List" movies={myList} onSelect={setSelected} isInList={isInList} onRemove={removeFromList} />
            )}
          </>
        )}
      </div>

      {/* ── MODAL ── */}
      {selected && (
        <MovieModal
          movie={selected}
          onClose={() => setSelected(null)}
          onAdd={addToList}
          onRemove={removeFromList}
          isInList={isInList(selected)}
        />
      )}
    </div>
  );
}
