const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static assets from public/
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON and URL-encoded form bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple in-memory user store for demo purposes
// users: Map username -> { password, token, onCount, offCount, driveChecked, friends: Set }
const users = new Map();

function generateToken() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function findUserByToken(token) {
  if (!token) return null;
  for (const [username, u] of users.entries()) {
    if (u.token === token) return { username, ...u };
  }
  return null;
}

// Helper to build user payload sent to client
function userPayload(username, u) {
  return {
    token: u.token,
    username,
    onCount: u.onCount || 0,
    offCount: u.offCount || 0,
    driveChecked: !!u.driveChecked,
  };
}

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }
  if (users.has(username)) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }
  const token = generateToken();
  users.set(username, { password, token, onCount: 0, offCount: 0, driveChecked: false, friends: new Set() });
  const u = users.get(username);
  return res.json({ success: true, user: userPayload(username, u) });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }
  const u = users.get(username);
  if (!u || u.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  // ensure token exists
  if (!u.token) u.token = generateToken();
  return res.json({ success: true, user: userPayload(username, u) });
});

// Logout endpoint
app.post('/logout', (req, res) => {
  // For demo, do nothing server-side
  return res.json({ success: true });
});

// Middleware to authenticate by Bearer token
function authMiddleware(req, res, next) {
  const auth = req.headers['authorization'] || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  const token = m ? m[1] : null;
  const user = findUserByToken(token);
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });
  req.auth = user; // includes username and stored fields
  next();
}

// Increment endpoint
app.post('/increment', authMiddleware, (req, res) => {
  const { type } = req.body || {};
  if (!type || (type !== 'on' && type !== 'off')) {
    return res.status(400).json({ success: false, message: 'Invalid type' });
  }
  const username = req.auth.username;
  const stored = users.get(username);
  if (type === 'on') stored.onCount = (stored.onCount || 0) + 1;
  if (type === 'off') stored.offCount = (stored.offCount || 0) + 1;
  return res.json({ success: true, onCount: stored.onCount, offCount: stored.offCount });
});

// Toggle drive
app.post('/toggle-drive', authMiddleware, (req, res) => {
  const username = req.auth.username;
  const stored = users.get(username);
  stored.driveChecked = !stored.driveChecked;
  return res.json({ success: true, driveChecked: stored.driveChecked });
});

// Add friend
app.post('/add-friend', authMiddleware, (req, res) => {
  const friend = (req.body && req.body.friend) || '';
  if (!friend) return res.status(400).json({ success: false, message: 'Missing friend username' });
  if (!users.has(friend)) return res.status(404).json({ success: false, message: 'Friend not found' });
  const username = req.auth.username;
  const stored = users.get(username);
  stored.friends.add(friend);
  return res.json({ success: true });
});

// Leaderboard - returns friends list for the current user
app.get('/leaderboard', authMiddleware, (req, res) => {
  const username = req.auth.username;
  const stored = users.get(username);
  const friends = Array.from(stored.friends || []).map((f) => {
    const fu = users.get(f);
    return { username: f, currentlyOn: Math.max((fu.onCount || 0) - (fu.offCount || 0), 0) };
  });
  return res.json({ friends });
});

// Fallback to index.html for client-side routing (if applicable)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
