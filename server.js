const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static("public")); // serve index.html

let users = {}; // in-memory user store

function makeUser(username) {
  return { username, onCount: 0, offCount: 0, driveChecked: false, friends: [] };
}

// login or create
app.post("/login", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "No username" });
  if (!users[username]) users[username] = makeUser(username);
  users[username].token = username + "_token"; // simple mock token
  res.json({ user: users[username] });
});

// auth middleware
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });
  const token = authHeader.split(" ")[1];
  const user = Object.values(users).find(u => u.token === token);
  if (!user) return res.status(403).json({ error: "Invalid token" });
  req.user = user;
  next();
}

app.get("/me", auth, (req, res) => {
  res.json({ user: req.user });
});

app.post("/increment", auth, (req, res) => {
  const { type } = req.body;
  if (type === "on") req.user.onCount++;
  else if (type === "off") req.user.offCount++;
  res.json({ updated: req.user });
});

app.post("/toggleDrive", auth, (req, res) => {
  req.user.driveChecked = !req.user.driveChecked;
  res.json({ driveChecked: req.user.driveChecked });
});

app.post("/friend", auth, (req, res) => {
  const { friendUsername } = req.body;
  if (!users[friendUsername]) users[friendUsername] = makeUser(friendUsername);
  if (!req.user.friends.includes(friendUsername)) {
    req.user.friends.push(friendUsername);
  }
  res.json({ ok: true });
});

app.get("/leaderboard", auth, (req, res) => {
  const friends = [req.user.username, ...req.user.friends];
  const leaderboard = friends.map(f => users[f]);
  res.json({ leaderboard });
});

app.listen(PORT, () => console.log("Server running on " + PORT));
