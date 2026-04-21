import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Login() {
  const nav = useNavigate();
  const [form, setForm]     = useState({ email: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5002/auth/login", form);
      localStorage.setItem("netflix_token", res.data.token);
      localStorage.setItem("netflix_user",  JSON.stringify(res.data.user));
      nav("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#000",
      backgroundImage: "url(https://assets.nflxext.com/ffe/siteui/vlv3/71cd5fc7-d5e0-4358-b261-92bf9c9bb63e/web/IN-en-20250113-TRIFECTA-perspective_61a3a462-75be-4f7b-be28-95b9fbc6cb83_medium.jpg)",
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      {/* Dark overlay */}
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)" }} />

      {/* Netflix logo top-left */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "20px 60px", zIndex: 10 }}>
        <h1 style={{ color: "#e50914", fontSize: "2rem", fontWeight: 900, cursor: "pointer" }} onClick={() => nav("/")}>NETFLIX</h1>
      </div>

      {/* Form card */}
      <div style={{
        position: "relative", zIndex: 5,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        borderRadius: "8px", padding: "60px 68px", width: "100%", maxWidth: "450px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
      }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "28px" }}>Sign In</h2>

        {error && (
          <div style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.4)", color: "#ff6b6b", padding: "12px 16px", borderRadius: "4px", marginBottom: "20px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <input
              name="email"
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={handleChange}
              required
              style={{ width: "100%", background: "#333", color: "white", border: "none", padding: "16px 20px", borderRadius: "4px", fontSize: "16px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              style={{ width: "100%", background: "#333", color: "white", border: "none", padding: "16px 20px", borderRadius: "4px", fontSize: "16px", outline: "none", boxSizing: "border-box" }}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", background: "#e50914", color: "white", border: "none", padding: "16px", borderRadius: "4px", fontWeight: 700, fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b3b3b3", fontSize: "13px", cursor: "pointer" }}>
            <input type="checkbox" style={{ accentColor: "#e50914" }} />
            Remember me
          </label>
          <span style={{ color: "#b3b3b3", fontSize: "13px", cursor: "pointer" }}>Need help?</span>
        </div>

        <p style={{ color: "#737373", marginTop: "40px", fontSize: "15px" }}>
          New to Netflix?{" "}
          <Link to="/signup" style={{ color: "white", fontWeight: 700, textDecoration: "none" }}>
            Sign up now.
          </Link>
        </p>

        <p style={{ color: "#8c8c8c", fontSize: "12px", marginTop: "14px", lineHeight: 1.6 }}>
          This page is protected by Google reCAPTCHA to ensure you're not a bot.
        </p>
      </div>
    </div>
  );
}
