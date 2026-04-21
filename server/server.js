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

// ✅ IMPORTANT: dynamic port for Render
const PORT = process.env.PORT || 5000;

// ✅ CORS FIX (replace with your Vercel URL)
app.use(cors({
  origin: "https://netflix-clonefinal.vercel.app",
  credentials: true
}));

app.use(express.json());

// ─── MongoDB connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

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

  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No account found" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    const token = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

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

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Netflix Watch Party 🎬" <${process.env.EMAIL_USER}>`,
      to,
      subject: "Watch Party Invite 🍿",
      html: `<a href="${roomUrl}">Join Watch Party</a>`
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "https://netflix-clonefinal.vercel.app",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!rooms[roomId]) {
      rooms[roomId] = {
        hostId: socket.id,
        users: [],
        time: 0,
        playing: false
      };
    }

    rooms[roomId].users.push({ id: socket.id, username });

    io.to(roomId).emit("room-update", rooms[roomId]);
  });

  socket.on("play", ({ roomId, time }) => {
    socket.to(roomId).emit("play", { time });
  });

  socket.on("pause", ({ roomId, time }) => {
    socket.to(roomId).emit("pause", { time });
  });

  socket.on("seek", ({ roomId, time }) => {
    socket.to(roomId).emit("seek", { time });
  });

  socket.on("chat-message", (msg) => {
    io.emit("chat-message", msg);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
  });
});

// ✅ FINAL FIX
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
