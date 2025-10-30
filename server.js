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
const users = new Map();

// Register endpoint
app.post('/register', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }
  if (users.has(username)) {
    return res.status(409).json({ success: false, message: 'User already exists' });
  }
  // WARNING: storing plain passwords is insecure; this is for demo only
  users.set(username, { password });
  return res.json({ success: true, message: 'Registration successful' });
});

// Login endpoint
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Missing username or password' });
  }
  const user = users.get(username);
  if (!user || user.password !== password) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  return res.json({ success: true, message: 'Login successful' });
});

// Fallback to index.html for client-side routing (if applicable)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
