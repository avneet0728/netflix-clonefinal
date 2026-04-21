import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Landing() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGetStarted = (e) => {
    e.preventDefault();
    nav("/signup", { state: { email } });
  };

  const features = [
    {
      title: "Enjoy on your TV",
      desc: "Watch on Smart TVs, PlayStation, Xbox, Chromecast, Apple TV, Blu-ray players, and more.",
      emoji: "📺",
      img: "https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/tv.png",
    },
    {
      title: "Download your shows",
      desc: "Save your favourites easily and always have something to watch.",
      emoji: "📱",
      img: "https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/mobile-0819.jpg",
      reverse: true,
    },
    {
      title: "Watch everywhere",
      desc: "Stream unlimited movies and TV shows on your phone, tablet, laptop, and TV.",
      emoji: "💻",
      img: "https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/device-pile-in.png",
    },
    {
      title: "🎬 Watch Party",
      desc: "Our exclusive Watch Party feature lets you sync trailers with friends in real-time — play, pause, seek together, and chat live.",
      emoji: "🎉",
      highlight: true,
      reverse: true,
    },
  ];

  const faqs = [
    { q: "What is Netflix Clone?", a: "A Netflix-inspired streaming UI with real trailer browsing, My List, and Watch Party — a feature that lets you sync video playback with a friend in real-time." },
    { q: "How does Watch Party work?", a: "Click Start Party on any movie, share the link with a friend. When you play or pause, their video syncs instantly via WebSocket technology." },
    { q: "Is it free?", a: "Yes! This is a portfolio project built with React, Node.js, Socket.IO, and MongoDB." },
    { q: "Can I watch on multiple devices?", a: "Yes. Open the Watch Party room on any device — desktop, tablet, or mobile." },
  ];

  return (
    <div style={{ background: "#000", color: "white", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>

      {/* NAVBAR */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 48px",
        background: scrolled ? "rgba(0,0,0,0.95)" : "transparent",
        transition: "background 0.4s",
      }}>
        <h1 style={{ color: "#e50914", fontSize: "2rem", fontWeight: 900, letterSpacing: "-1px" }}>NETFLIX</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={() => nav("/login")} style={{
            background: "#e50914", color: "white", border: "none",
            padding: "8px 20px", borderRadius: "4px", fontWeight: 700,
            cursor: "pointer", fontSize: "14px",
          }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        position: "relative", minHeight: "100vh",
        display: "flex", alignItems: "center", justifyContent: "center",
        textAlign: "center",
        backgroundImage: `url(https://assets.nflxext.com/ffe/siteui/acquisition/ourStory/fuji/desktop/hero-image.jpg)`,
        backgroundSize: "cover", backgroundPosition: "center",
      }}>
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
        {/* Bottom fade */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "200px", background: "linear-gradient(transparent, #000)" }} />
        {/* Top fade */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "120px", background: "linear-gradient(#000, transparent)" }} />

        <div style={{ position: "relative", maxWidth: "700px", padding: "0 24px" }}>
          <h2 style={{
            fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 900,
            lineHeight: 1.15, marginBottom: "20px",
            textShadow: "2px 2px 10px rgba(0,0,0,0.8)",
          }}>
            Unlimited movies, TV shows, and more
          </h2>
          <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.4rem)", marginBottom: "8px", color: "#ddd" }}>
            Watch anywhere. Cancel anytime.
          </p>
          <p style={{ fontSize: "1.1rem", marginBottom: "28px", color: "#ddd" }}>
            Ready to watch? Enter your email to create or restart your membership.
          </p>

          <form onSubmit={handleGetStarted} style={{ display: "flex", gap: "8px", maxWidth: "560px", margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1, minWidth: "260px", padding: "18px 16px",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.4)",
                color: "white", fontSize: "16px", borderRadius: "4px", outline: "none",
              }}
            />
            <button type="submit" style={{
              background: "#e50914", color: "white", border: "none",
              padding: "18px 28px", borderRadius: "4px",
              fontWeight: 700, fontSize: "1.1rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "8px",
              whiteSpace: "nowrap",
            }}>
              Get Started ›
            </button>
          </form>
        </div>
      </div>

      {/* DIVIDER */}
      <div style={{ height: "8px", background: "#222" }} />

      {/* FEATURES */}
      {features.map((f, i) => (
        <div key={i}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            maxWidth: "1100px", margin: "0 auto",
            padding: "70px 48px",
            flexDirection: f.reverse ? "row-reverse" : "row",
            gap: "48px",
          }}>
            {/* Text */}
            <div style={{ flex: 1 }}>
              {f.highlight && (
                <span style={{
                  background: "#e50914", color: "white", padding: "4px 12px",
                  borderRadius: "12px", fontSize: "12px", fontWeight: 700,
                  display: "inline-block", marginBottom: "14px",
                }}>
                  NEW FEATURE
                </span>
              )}
              <h3 style={{
                fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 800,
                lineHeight: 1.2, marginBottom: "18px",
              }}>
                {f.title}
              </h3>
              <p style={{ fontSize: "1.1rem", color: "#ccc", lineHeight: 1.75 }}>
                {f.desc}
              </p>
              {f.highlight && (
                <button
                  onClick={() => nav("/login")}
                  style={{
                    marginTop: "24px", background: "#e50914", color: "white", border: "none",
                    padding: "12px 24px", borderRadius: "4px", fontWeight: 700,
                    cursor: "pointer", fontSize: "15px",
                  }}
                >
                  🎉 Try Watch Party
                </button>
              )}
            </div>

            {/* Image or Icon */}
            <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
              {f.img ? (
                <img
                  src={f.img}
                  alt={f.title}
                  style={{ maxWidth: "100%", maxHeight: "300px", objectFit: "contain" }}
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}
              <div style={{
                display: f.img ? "none" : "flex",
                fontSize: "8rem", alignItems: "center", justifyContent: "center",
                width: "280px", height: "200px",
                background: "rgba(229,9,20,0.1)", borderRadius: "16px",
                border: "1px solid rgba(229,9,20,0.2)",
              }}>
                {f.emoji}
              </div>
            </div>
          </div>
          <div style={{ height: "8px", background: "#222" }} />
        </div>
      ))}

      {/* FAQ */}
      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "70px 24px" }}>
        <h3 style={{ fontSize: "2.2rem", fontWeight: 800, textAlign: "center", marginBottom: "40px" }}>
          Frequently Asked Questions
        </h3>
        {faqs.map((faq, i) => (
          <FAQItem key={i} q={faq.q} a={faq.a} />
        ))}

        {/* CTA repeat */}
        <div style={{ textAlign: "center", marginTop: "48px" }}>
          <p style={{ fontSize: "1.1rem", marginBottom: "20px", color: "#ddd" }}>
            Ready to watch? Enter your email to get started.
          </p>
          <form onSubmit={handleGetStarted} style={{ display: "flex", gap: "8px", maxWidth: "520px", margin: "0 auto", flexWrap: "wrap", justifyContent: "center" }}>
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                flex: 1, minWidth: "220px", padding: "16px 14px",
                background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.3)",
                color: "white", fontSize: "15px", borderRadius: "4px", outline: "none",
              }}
            />
            <button type="submit" style={{
              background: "#e50914", color: "white", border: "none",
              padding: "16px 24px", borderRadius: "4px",
              fontWeight: 700, fontSize: "1rem", cursor: "pointer",
            }}>
              Get Started ›
            </button>
          </form>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ background: "#000", borderTop: "1px solid #222", padding: "40px 48px" }}>
        <p style={{ color: "#666", marginBottom: "24px", fontSize: "14px" }}>Questions? Call 000-800-040-1843</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", maxWidth: "800px" }}>
          {["FAQ", "Investor Relations", "Privacy", "Speed Test", "Help Centre", "Jobs", "Cookie Preferences", "Legal Notices", "Account", "Ways to Watch", "Corporate Information", "Only on Netflix", "Media Centre", "Terms of Use", "Contact Us"].map((link) => (
            <span key={link} style={{ color: "#666", fontSize: "13px", cursor: "pointer", textDecoration: "underline" }}>{link}</span>
          ))}
        </div>
        <p style={{ color: "#666", marginTop: "24px", fontSize: "13px" }}>Netflix Clone — Portfolio Project</p>
      </div>

      <style>{`
        input::placeholder { color: rgba(255,255,255,0.5); }
        * { box-sizing: border-box; }
      `}</style>
    </div>
  );
}

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginBottom: "8px" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "#2d2d2d", color: "white", border: "none",
          padding: "20px 24px", textAlign: "left", fontSize: "1.1rem", fontWeight: 600,
          cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center",
          transition: "background 0.2s",
        }}
        onMouseOver={(e) => e.currentTarget.style.background = "#3d3d3d"}
        onMouseOut={(e) => e.currentTarget.style.background = "#2d2d2d"}
      >
        {q}
        <span style={{ fontSize: "1.6rem", transform: open ? "rotate(45deg)" : "none", transition: "transform 0.2s" }}>+</span>
      </button>
      {open && (
        <div style={{
          background: "#2d2d2d", color: "#ddd", padding: "20px 24px",
          fontSize: "1rem", lineHeight: 1.7, borderTop: "2px solid #000",
        }}>
          {a}
        </div>
      )}
    </div>
  );
}
