// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve index.html from public/

// ----------------- In-memory storage -----------------
let users = {}; 
// Format: { username: { username, passwordHash, onCount, offCount, driveChecked, friends: [], token } }

// ----------------- Auth middleware -----------------
function authMiddleware(req, res, next) {
  const auth = req.headers["authorization"];
  if (!auth) return res.status(401).json({ error: "Missing token" });
  // support "Bearer token" or just "token"
  const parts = auth.split(" ");
  const token = parts.length > 1 ? parts[1] : parts[0];
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(403).json({ error: "Invalid token" });
  req.user = user;
  next();
}

// ----------------- Endpoints -----------------

// Login or register
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: "Missing username/password" });

  if (!users[username]) {
    // Register new user
    const hash = await bcrypt.hash(password, 10);
    users[username] = { username, passwordHash: hash, onCount: 0, offCount: 0, driveChecked: false, friends: [], token: null };
  }

  const valid = await bcrypt.compare(password, users[username].passwordHash);
  if (!valid) return res.status(403).json({ error: "Invalid password" });

  // Generate simple token
  const token = username + "_token_" + Date.now();
  users[username].token = token;

  res.json({ user: { username, onCount: users[username].onCount, offCount: users[username].offCount, driveChecked: users[username].driveChecked, token } });
});

// Logout
app.post("/logout", authMiddleware, (req, res) => {
  req.user.token = null;
  res.json({ success: true });
});

// Increment lights
app.post("/increment", authMiddleware, (req, res) => {
  const { type } = req.body;
  if (type === "on") req.user.onCount = (req.user.onCount || 0) + 1;
  if (type === "off") req.user.offCount = (req.user.offCount || 0) + 1;
  res.json({ success: true, onCount: req.user.onCount, offCount: req.user.offCount });
});

// Toggle driving minimized
app.post("/toggle-drive", authMiddleware, (req, res) => {
  req.user.driveChecked = !req.user.driveChecked;
  res.json({ success: true, driveChecked: req.user.driveChecked });
});

// Add friend
app.post("/add-friend", authMiddleware, (req, res) => {
  const { friend } = req.body;
  if (!friend) return res.status(400).json({ error: "Missing friend username" });
  if (!users[friend]) return res.status(404).json({ error: "Friend not found" });
  if (!req.user.friends.includes(friend)) req.user.friends.push(friend);
  res.json({ success: true });
});

// Leaderboard (friends only)
app.get("/leaderboard", authMiddleware, (req, res) => {
  const friendsData = req.user.friends.map(f => {
    const u = users[f];
    const currentlyOn = u ? Math.max((u.onCount || 0) - (u.offCount || 0), 0) : 0;
    return { username: f, currentlyOn };
  });
  // sort descending by currentlyOn
  friendsData.sort((a, b) => b.currentlyOn - a.currentlyOn);
  res.json({ friends: friendsData });
});

// ---------------- NEW ENDPOINT ----------------
// Get current user info (for persistent login)
app.get("/user-info", authMiddleware, (req, res) => {
  const { username, onCount, offCount, driveChecked } = req.user;
  res.json({ username, onCount, offCount, driveChecked });
});

// ---------------- NEW ENDPOINT ----------------
// Leaderboard for all users (useful for statistics page)
app.get("/leaderboard/all", authMiddleware, (req, res) => {
  const all = Object.values(users).map(u => {
    const currentlyOn = Math.max((u.onCount || 0) - (u.offCount || 0), 0);
    return { username: u.username, currentlyOn };
  });
  all.sort((a, b) => b.currentlyOn - a.currentlyOn);
  res.json({ users: all });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
