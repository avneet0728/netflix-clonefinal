import express from "express";
import http from "http";
import { Server } from "socket.io";
import nodemailer from "nodemailer";
import cors from "cors";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());

// ─── MongoDB connection ───────────────────────────────────────────────────────

const MONGO_URI = "mongodb+srv://netflixuser:netflix123@cluster0.9lhcg2m.mongodb.net/?appName=Cluster";
const JWT_SECRET = process.env.JWT_SECRET || "netflix_super_secret_key_2024";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// ─── User schema ──────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);

// ─── Auth middleware ──────────────────────────────────────────────────────────
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token" });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
};

// ─── Auth routes ──────────────────────────────────────────────────────────────
app.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields required" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password must be at least 6 characters" });

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: "Email and password required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No account with this email" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/auth/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ─── Email invite ─────────────────────────────────────────────────────────────
app.post("/send-invite", async (req, res) => {
  const { to, roomUrl } = req.body;
  if (!to || !roomUrl) return res.status(400).json({ error: "Missing fields" });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER || "your@gmail.com",
      pass: process.env.EMAIL_PASS || "your-app-password",
    },
  });

  try {
    await transporter.sendMail({
      from: `"Netflix Watch Party 🎬" <${process.env.EMAIL_USER}>`,
      to,
      subject: "You're invited to a Watch Party! 🍿",
      html: `
        <div style="background:#141414;color:white;padding:36px;font-family:'Helvetica Neue',sans-serif;max-width:500px;margin:0 auto;border-radius:10px">
          <h1 style="color:#e50914;margin-bottom:8px">🎬 Watch Party</h1>
          <p style="color:#ccc;font-size:16px;line-height:1.6;margin-bottom:24px">
            Someone invited you to watch a trailer together in real-time sync!
          </p>
          <a href="${roomUrl}" style="display:inline-block;background:#e50914;color:white;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:16px">
            Join the Watch Party →
          </a>
          <p style="color:#555;font-size:12px;margin-top:20px;word-break:break-all">Link: ${roomUrl}</p>
        </div>
      `,
    });
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, { cors: { origin: "*" } });

// rooms: { roomId: { hostId, users:[{id,username}], time, playing } }
const rooms = {};

io.on("connection", (socket) => {
  console.log("✅ Socket connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);
    socket.roomId  = roomId;
    socket.username = username;

    if (!rooms[roomId]) {
      rooms[roomId] = { hostId: socket.id, users: [], time: 0, playing: false };
      console.log(`🏠 Room created: ${roomId} | host: ${socket.id}`);
    }

    rooms[roomId].users.push({ id: socket.id, username });

    // Tell everyone current room state
    io.to(roomId).emit("room-update", {
      users:  rooms[roomId].users,
      hostId: rooms[roomId].hostId,
    });

    // Sync new joiner to host's current position
    if (socket.id !== rooms[roomId].hostId) {
      socket.emit("sync-state", {
        time:    rooms[roomId].time,
        playing: rooms[roomId].playing,
      });
    }
  });

  // ── PLAY: host emits → server broadcasts to ALL others ──
  socket.on("play", ({ roomId, time }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].time    = time;
    rooms[roomId].playing = true;
    // Use socket.to so the sender doesn't get it back (prevents echo)
    socket.to(roomId).emit("play", { time });
    console.log(`▶ play in ${roomId} at ${time}s`);
  });

  // ── PAUSE: host emits → server broadcasts to ALL others ──
  socket.on("pause", ({ roomId, time }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].time    = time;
    rooms[roomId].playing = false;
    socket.to(roomId).emit("pause", { time });
    console.log(`⏸ pause in ${roomId} at ${time}s`);
  });

  // ── SEEK ──
  socket.on("seek", ({ roomId, time }) => {
    if (!rooms[roomId]) return;
    rooms[roomId].time = time;
    socket.to(roomId).emit("seek", { time });
  });

  // ── HEARTBEAT: host sends every 3s for drift correction ──
  socket.on("heartbeat", ({ roomId, time, playing }) => {
    if (!rooms[roomId]) return;
    if (socket.id !== rooms[roomId].hostId) return;
    rooms[roomId].time    = time;
    rooms[roomId].playing = playing;
    // Only sync guests if they drift more than 2 seconds (handled client side)
    socket.to(roomId).emit("heartbeat", { time, playing });
  });

  // ── CHAT: broadcast to ENTIRE room including sender ──
  socket.on("chat-message", ({ roomId, username, text }) => {
    console.log(`💬 [${roomId}] ${username}: ${text}`);
    // io.to sends to everyone INCLUDING the sender
    io.to(roomId).emit("chat-message", {
      username,
      text,
      ts: Date.now(),
    });
  });

  socket.on("disconnect", () => {
    const { roomId, username } = socket;
    if (!roomId || !rooms[roomId]) return;

    rooms[roomId].users = rooms[roomId].users.filter((u) => u.id !== socket.id);

    if (rooms[roomId].hostId === socket.id && rooms[roomId].users.length > 0) {
      rooms[roomId].hostId = rooms[roomId].users[0].id;
      console.log(`👑 New host: ${rooms[roomId].users[0].username}`);
    }

    if (rooms[roomId].users.length === 0) {
      delete rooms[roomId];
    } else {
      io.to(roomId).emit("room-update", {
        users:  rooms[roomId].users,
        hostId: rooms[roomId].hostId,
      });
    }

    console.log(`❌ Disconnected: ${username}`);
  });
});

server.listen(5002, () => {
  console.log("🚀 Server on http://localhost:5002");
});