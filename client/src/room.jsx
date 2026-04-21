import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import YouTube from "react-youtube";

// Create socket ONCE outside component so it's never recreated
const socket = io("http://localhost:5002", { autoConnect: false });

export default function Room() {
  const { roomId }   = useParams();
  const [params]     = useSearchParams();
  const videoId      = params.get("video");
  const title        = decodeURIComponent(params.get("title") || "Watch Party");
  const nav          = useNavigate();

  const playerRef       = useRef(null);
  const isHostRef       = useRef(false);
  const isSyncingRef    = useRef(false); // true while we apply a remote event → don't re-emit
  const lastEmitRef     = useRef(0);     // debounce guard

  const [users,      setUsers]      = useState([]);
  const [isHost,     setIsHost]     = useState(false);
  const [connected,  setConnected]  = useState(false);
  const [syncStatus, setSyncStatus] = useState("Connecting...");
  const [copied,     setCopied]     = useState(false);
  const [chatMsg,    setChatMsg]    = useState("");
  const [messages,   setMessages]   = useState([]);
  const chatEndRef = useRef(null);

  const username = useRef(`Guest${Math.floor(Math.random() * 9000) + 1000}`).current;
  const roomUrl  = window.location.href;

  // ── auto-scroll chat ──────────────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── socket lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !videoId) return;

    socket.connect();

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("join-room", { roomId, username });
    });

    socket.on("disconnect", () => {
      setConnected(false);
      setSyncStatus("Disconnected — reconnecting...");
    });

    socket.on("room-update", ({ users: roomUsers, hostId }) => {
      setUsers(roomUsers || []);
      const amHost = hostId === socket.id;
      isHostRef.current = amHost;
      setIsHost(amHost);
      setSyncStatus(
        amHost
          ? `You are the host • ${roomUsers.length} watching`
          : `Synced with host • ${roomUsers.length} watching`
      );
    });

    // Received when we first join (or heartbeat drift correction)
    socket.on("sync-state", ({ time, playing }) => {
      if (!playerRef.current) return;
      isSyncingRef.current = true;
      playerRef.current.seekTo(time, true);
      playing ? playerRef.current.playVideo() : playerRef.current.pauseVideo();
      setTimeout(() => { isSyncingRef.current = false; }, 800);
    });

    // ── THE KEY FIX: guests receive play/pause from server ──
    socket.on("play", ({ time }) => {
      console.log("📡 received PLAY at", time);
      if (!playerRef.current) return;
      isSyncingRef.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
      setTimeout(() => { isSyncingRef.current = false; }, 800);
    });

    socket.on("pause", ({ time }) => {
      console.log("📡 received PAUSE at", time);
      if (!playerRef.current) return;
      isSyncingRef.current = true;
      playerRef.current.seekTo(time, true);
      playerRef.current.pauseVideo();
      setTimeout(() => { isSyncingRef.current = false; }, 800);
    });

    socket.on("seek", ({ time }) => {
      if (!playerRef.current) return;
      isSyncingRef.current = true;
      playerRef.current.seekTo(time, true);
      setTimeout(() => { isSyncingRef.current = false; }, 800);
    });

    // Heartbeat drift correction for guests (only correct if > 2s drift)
    socket.on("heartbeat", ({ time, playing }) => {
      if (!playerRef.current || isHostRef.current) return;
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const drift = Math.abs(currentTime - time);
        if (drift > 2) {
          isSyncingRef.current = true;
          playerRef.current.seekTo(time, true);
          setTimeout(() => { isSyncingRef.current = false; }, 800);
        }
      } catch (_) {}
    });

    // ── CHAT FIX: receive and display messages ──
    socket.on("chat-message", (msg) => {
      console.log("💬 chat received:", msg);
      setMessages((prev) => [...prev.slice(-99), msg]);
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room-update");
      socket.off("sync-state");
      socket.off("play");
      socket.off("pause");
      socket.off("seek");
      socket.off("heartbeat");
      socket.off("chat-message");
      socket.disconnect();
    };
  }, [roomId, videoId, username]);

  // ── Host heartbeat every 3s ───────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHostRef.current || !playerRef.current) return;
      try {
        const state   = playerRef.current.getPlayerState();
        const time    = playerRef.current.getCurrentTime();
        socket.emit("heartbeat", { roomId, time, playing: state === 1 });
      } catch (_) {}
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  // ── Player callbacks (ONLY host emits) ───────────────────────────────────
  const onReady = (e) => {
    playerRef.current = e.target;
  };

  const onPlay = useCallback(() => {
    // Skip if we're currently applying a remote event
    if (isSyncingRef.current) return;
    // Skip if not host — guests must NOT emit (prevents echo loop)
    if (!isHostRef.current) return;

    const now = Date.now();
    if (now - lastEmitRef.current < 300) return; // debounce
    lastEmitRef.current = now;

    const time = playerRef.current?.getCurrentTime() || 0;
    console.log("📤 emitting PLAY at", time);
    socket.emit("play", { roomId, time });
  }, [roomId]);

  const onPause = useCallback(() => {
    if (isSyncingRef.current) return;
    if (!isHostRef.current) return;

    const now = Date.now();
    if (now - lastEmitRef.current < 300) return;
    lastEmitRef.current = now;

    const time = playerRef.current?.getCurrentTime() || 0;
    console.log("📤 emitting PAUSE at", time);
    socket.emit("pause", { roomId, time });
  }, [roomId]);

  const onStateChange = useCallback((e) => {
    // YT state 3 = buffering (happens after a seek)
    if (e.data === 3 && isHostRef.current && !isSyncingRef.current) {
      const time = playerRef.current?.getCurrentTime?.() || 0;
      socket.emit("seek", { roomId, time });
    }
  }, [roomId]);

  // ── Chat send ─────────────────────────────────────────────────────────────
  const sendChat = (e) => {
    e?.preventDefault();
    const text = chatMsg.trim();
    if (!text) return;
    console.log("📤 sending chat:", text);
    socket.emit("chat-message", { roomId, username, text });
    setChatMsg("");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── No video guard ────────────────────────────────────────────────────────
  if (!videoId) {
    return (
      <div style={{ background: "#141414", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "20px", color: "white" }}>
        <div style={{ fontSize: "4rem" }}>🎬</div>
        <p style={{ fontSize: "1.2rem", color: "#aaa" }}>No video selected.</p>
        <button onClick={() => nav("/")} style={{ background: "#e50914", color: "white", border: "none", padding: "12px 28px", borderRadius: "5px", fontWeight: 700, cursor: "pointer", fontSize: "15px" }}>
          ← Back to Home
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: "#0c0c0c", minHeight: "100vh", color: "white" }}>

      {/* TOP BAR */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 32px", background: "#141414", borderBottom: "1px solid #1e1e1e", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span onClick={() => nav("/")} style={{ color: "#e50914", fontSize: "1.5rem", fontWeight: 900, cursor: "pointer" }}>NETFLIX</span>
          <span style={{ color: "#444" }}>›</span>
          <span style={{ fontWeight: 700, fontSize: "15px", color: "#ddd" }}>{title}</span>
          {isHost && (
            <span style={{ background: "rgba(229,9,20,0.2)", color: "#e50914", padding: "2px 8px", borderRadius: "10px", fontSize: "11px", fontWeight: 700 }}>HOST</span>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          {/* Avatars */}
          <div style={{ display: "flex" }}>
            {users.map((u, i) => (
              <div key={u.id || i} title={u.username} style={{ width: 32, height: 32, borderRadius: "50%", background: ["#e50914","#46d369","#f5a623","#6c63ff"][i % 4], display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 700, border: "2px solid #0c0c0c", marginLeft: i > 0 ? "-8px" : 0, position: "relative", zIndex: users.length - i }}>
                {u.username?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <span style={{ color: "#888", fontSize: "13px" }}>{users.length} viewer{users.length !== 1 ? "s" : ""}</span>

          {/* Live indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#46d369" : "#f5a623", boxShadow: connected ? "0 0 6px #46d369" : "none" }} />
            <span style={{ color: "#777", fontSize: "12px" }}>{connected ? "Live" : "Reconnecting..."}</span>
          </div>

          <button onClick={copyLink} style={{ background: copied ? "#46d369" : "#e50914", color: "white", border: "none", padding: "8px 18px", borderRadius: "5px", cursor: "pointer", fontWeight: 700, fontSize: "13px", transition: "background 0.3s" }}>
            {copied ? "✓ Copied!" : "🔗 Share"}
          </button>
        </div>
      </div>

      {/* MAIN: VIDEO + CHAT */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", maxWidth: "1400px", margin: "0 auto", padding: "24px", gap: "24px" }}>

        {/* VIDEO */}
        <div>
          <div style={{ borderRadius: "10px", overflow: "hidden", boxShadow: "0 20px 70px rgba(0,0,0,0.8)", background: "#000" }}>
            <YouTube
              videoId={videoId}
              opts={{ width: "100%", height: "520", playerVars: { autoplay: 1, modestbranding: 1, rel: 0 } }}
              onReady={onReady}
              onPlay={onPlay}
              onPause={onPause}
              onStateChange={onStateChange}
              style={{ display: "block" }}
            />
          </div>

          {/* Sync status */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: "14px" }}>
            <div style={{ display: "inline-flex", gap: "8px", alignItems: "center", background: "#1a1a1a", padding: "10px 22px", borderRadius: "24px", border: "1px solid #2a2a2a", fontSize: "13px" }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: connected ? "#46d369" : "#f5a623", boxShadow: connected ? "0 0 8px #46d369" : "none" }} />
              <span style={{ color: "#bbb" }}>{syncStatus}</span>
            </div>
          </div>

          {/* Share bar */}
          <div style={{ marginTop: "16px", background: "#141414", borderRadius: "10px", padding: "16px 20px", border: "1px solid #1e1e1e", display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "180px" }}>
              <p style={{ fontWeight: 700, marginBottom: "3px", fontSize: "14px" }}>🎉 Watching: {title}</p>
              <p style={{ color: "#666", fontSize: "12px" }}>Share link — friend joins and syncs instantly</p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", background: "#0a0a0a", padding: "8px 12px", borderRadius: "6px", border: "1px solid #2a2a2a", flex: 2 }}>
              <span style={{ color: "#555", fontSize: "12px", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{roomUrl}</span>
              <button onClick={copyLink} style={{ background: copied ? "#46d369" : "#e50914", color: "white", border: "none", padding: "5px 14px", borderRadius: "4px", cursor: "pointer", fontWeight: 700, fontSize: "12px", transition: "background 0.3s", whiteSpace: "nowrap" }}>
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>

          {/* Guest notice */}
          {!isHost && (
            <div style={{ marginTop: "12px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "8px", padding: "12px 18px", fontSize: "13px", color: "#f5a623", display: "flex", gap: "8px", alignItems: "center" }}>
              <span>ℹ️</span>
              <span>You're a guest. The host controls playback — you stay in sync automatically.</span>
            </div>
          )}
        </div>

        {/* CHAT */}
        <div style={{ background: "#141414", border: "1px solid #1e1e1e", borderRadius: "10px", display: "flex", flexDirection: "column", height: "570px" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #1e1e1e", fontWeight: 700, fontSize: "14px", color: "#ddd" }}>
            💬 Party Chat
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.length === 0 ? (
              <div style={{ textAlign: "center", color: "#444", fontSize: "13px", marginTop: "40px", lineHeight: 1.8 }}>
                <div style={{ fontSize: "2rem", marginBottom: "8px" }}>👋</div>
                <div>No messages yet.</div>
                <div>Say hi to your watch party!</div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} style={{ background: msg.username === username ? "rgba(229,9,20,0.12)" : "rgba(255,255,255,0.04)", padding: "8px 12px", borderRadius: "8px", borderLeft: `3px solid ${msg.username === username ? "#e50914" : "#333"}` }}>
                  <div style={{ fontSize: "11px", color: "#666", marginBottom: "3px" }}>
                    {msg.username === username ? "You" : msg.username}
                  </div>
                  <div style={{ fontSize: "13px", color: "#ddd", lineHeight: 1.45 }}>{msg.text}</div>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 14px", borderTop: "1px solid #1e1e1e", display: "flex", gap: "8px" }}>
            <input
              placeholder="Say something..."
              value={chatMsg}
              onChange={(e) => setChatMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") sendChat(); }}
              style={{ flex: 1, background: "#0a0a0a", color: "white", border: "1px solid #2a2a2a", padding: "8px 12px", borderRadius: "5px", fontSize: "13px", outline: "none" }}
            />
            <button
              onClick={sendChat}
              style={{ background: "#e50914", color: "white", border: "none", padding: "8px 16px", borderRadius: "5px", cursor: "pointer", fontWeight: 700, fontSize: "14px" }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
    </div>
  );
}
