<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Statistics</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css">
<style>
  body { font-family: system-ui, -apple-system, Roboto, "Helvetica Neue", Arial; padding: 20px; max-width: 980px; margin: auto; }
  h1 { margin-bottom: 8px; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; margin-bottom: 18px; }
  .card { padding: 12px; border: 1px solid #ddd; border-radius: 6px; background: #fafafa; }
  table { width: 100%; border-collapse: collapse; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #eee; text-align: left; }
  #histogram { display:flex; align-items:flex-end; gap:4px; height:140px; padding:8px; border:1px solid #eee; border-radius:6px; background:#fff; }
  .bar { flex:1; display:flex; align-items:flex-end; justify-content:center; background:#3b82f6; color:#fff; border-radius:4px 4px 0 0; font-size:12px; }
  .muted { color:#666; font-size:13px; }
  nav a { margin-right:12px; }
</style>
</head>
<body>
  <nav style="margin-bottom:12px;">
    <a href="index.html" class="text-indigo-600 underline">Home</a>
    <a href="stats.html" class="text-gray-700">Statistics</a>
  </nav>

  <h1>Leaderboard Statistics</h1>
  <p class="muted">Aggregated stats computed from the server-side leaderboard for all users (requires login).</p>

  <div class="grid" id="summary">
    <div class="card">
      <strong>Total players</strong>
      <div id="total" style="font-size:22px;margin-top:6px;">—</div>
    </div>
    <div class="card">
      <strong>Average score</strong>
      <div id="avg" style="font-size:22px;margin-top:6px;">—</div>
    </div>
    <div class="card">
      <strong>Median score</strong>
      <div id="median" style="font-size:22px;margin-top:6px;">—</div>
    </div>
    <div class="card">
      <strong>Top score</strong>
      <div id="max" style="font-size:22px;margin-top:6px;">—</div>
    </div>
  </div>

  <section class="card" style="margin-bottom:12px;">
    <h2 style="margin-top:0">Top 10 players</h2>
    <table id="top10">
      <thead><tr><th>#</th><th>Player</th><th>Score</th></tr></thead>
      <tbody><tr><td colspan="3">Loading...</td></tr></tbody>
    </table>
  </section>

  <section class="card">
    <h2 style="margin-top:0">Score distribution</h2>
    <div id="histogram">Loading...</div>
    <div class="muted" style="margin-top:8px">Histogram uses 6 buckets, computed from the data range.</div>
  </section>

  <script src="stats.js"></script>
</body>
</html>
