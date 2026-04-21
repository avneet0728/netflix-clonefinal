import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import axios from "axios";

export default function Signup() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm]     = useState({ name: "", email: searchParams.get("email") || "", password: "", confirm: "" });
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm)
      return setError("Passwords don't match.");
    if (form.password.length < 6)
      return setError("Password must be at least 6 characters.");

    setLoading(true);
    try {
      const res = await axios.post("http://localhost:5002/auth/signup", {
        name:     form.name,
        email:    form.email,
        password: form.password,
      });
      localStorage.setItem("netflix_token", res.data.token);
      localStorage.setItem("netflix_user",  JSON.stringify(res.data.user));
      nav("/home");
    } catch (err) {
      setError(err.response?.data?.error || "Signup failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // Password strength
  const getStrength = (pw) => {
    if (!pw) return null;
    if (pw.length < 6) return { label: "Too short", color: "#e50914" };
    if (pw.length < 8)  return { label: "Weak",      color: "#f5a623" };
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) return { label: "Strong", color: "#46d369" };
    return { label: "Good", color: "#46d369" };
  };
  const strength = getStrength(form.password);

  return (
    <div style={{
      minHeight: "100vh", background: "#000",
      backgroundImage: "url(https://assets.nflxext.com/ffe/siteui/vlv3/71cd5fc7-d5e0-4358-b261-92bf9c9bb63e/web/IN-en-20250113-TRIFECTA-perspective_61a3a462-75be-4f7b-be28-95b9fbc6cb83_medium.jpg)",
      backgroundSize: "cover", backgroundPosition: "center",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    }}>
      <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)" }} />

      <div style={{ position: "fixed", top: 0, left: 0, right: 0, padding: "20px 60px", zIndex: 10 }}>
        <h1 style={{ color: "#e50914", fontSize: "2rem", fontWeight: 900, cursor: "pointer" }} onClick={() => nav("/")}>NETFLIX</h1>
      </div>

      <div style={{
        position: "relative", zIndex: 5,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        borderRadius: "8px", padding: "60px 68px", width: "100%", maxWidth: "450px",
        boxShadow: "0 8px 40px rgba(0,0,0,0.8)",
      }}>
        <h2 style={{ fontSize: "2rem", fontWeight: 800, marginBottom: "8px" }}>Create Account</h2>
        <p style={{ color: "#aaa", marginBottom: "28px", fontSize: "15px" }}>Join Netflix Clone. It's free.</p>

        {error && (
          <div style={{ background: "rgba(229,9,20,0.15)", border: "1px solid rgba(229,9,20,0.4)", color: "#ff6b6b", padding: "12px 16px", borderRadius: "4px", marginBottom: "20px", fontSize: "14px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {[
            { name: "name",     type: "text",     placeholder: "Full name" },
            { name: "email",    type: "email",    placeholder: "Email address" },
            { name: "password", type: "password", placeholder: "Password (min 6 chars)" },
            { name: "confirm",  type: "password", placeholder: "Confirm password" },
          ].map((field) => (
            <div key={field.name} style={{ marginBottom: "14px" }}>
              <input
                name={field.name}
                type={field.type}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={handleChange}
                required
                style={{ width: "100%", background: "#333", color: "white", border: "none", padding: "16px 20px", borderRadius: "4px", fontSize: "16px", outline: "none", boxSizing: "border-box" }}
              />
              {/* Password strength indicator */}
              {field.name === "password" && strength && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                  <div style={{ flex: 1, height: "3px", background: "#333", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", background: strength.color, width: strength.label === "Too short" ? "20%" : strength.label === "Weak" ? "50%" : strength.label === "Good" ? "75%" : "100%", transition: "width 0.3s" }} />
                  </div>
                  <span style={{ fontSize: "11px", color: strength.color, fontWeight: 600 }}>{strength.label}</span>
                </div>
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", background: "#e50914", color: "white", border: "none", padding: "16px", borderRadius: "4px", fontWeight: 700, fontSize: "16px", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1, marginTop: "10px" }}
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ color: "#737373", marginTop: "40px", fontSize: "15px" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "white", fontWeight: 700, textDecoration: "none" }}>
            Sign in.
          </Link>
        </p>
      </div>
    </div>
  );
}
