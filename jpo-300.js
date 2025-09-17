<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>🏁 Leaderboard</title>
  <style>
    :root {
      --bg: #0f172a; /* slate-900 */
      --panel: #111827ee; /* gray-900 */
      --muted: #94a3b8; /* slate-400 */
      --text: #e5e7eb; /* gray-200 */
      --accent: #22c55e; /* green-500 */
      --accent-2: #3b82f6; /* blue-500 */
      --danger: #ef4444; /* red-500 */
      --shadow: 0 10px 30px rgba(0,0,0,.35);
      --radius: 18px;
    }

    * { box-sizing: border-box; }
    html, body { height: 100%; }
    body {
      margin: 0; font: 16px/1.45 system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      background: linear-gradient(120deg, #0b1022, #0f172a 45%, #0b1022);
      color: var(--text);
      display: grid;
      place-items: start center;
      padding: 40px 16px 120px;
    }

    .app {
      width: 100%;
      max-width: 980px;
    }

    .card {
      background: var(--panel);
      border: 1px solid rgba(255,255,255,.05);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      backdrop-filter: blur(8px);
      padding: 18px;
    }

    h1 { margin: 0 0 8px; font-size: 28px; letter-spacing: .4px; }
    .sub { color: var(--muted); margin-bottom: 16px; font-size: 14px; }

    .toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 12px; flex-wrap: wrap; }

    button, .btn {
      appearance: none; border: 0; cursor: pointer; border-radius: 9999px; padding: 10px 16px; font-weight: 600;
      background: #1f2937; color: var(--text); box-shadow: inset 0 0 0 1px rgba(255,255,255,.06);
      transition: transform .06s ease, box-shadow .2s ease, background .2s ease, opacity .2s ease;
    }
    button:hover { box-shadow: inset 0 0 0 1px rgba(255,255,255,.14); }
    button:active { transform: translateY(1px); }
    button[disabled] { opacity: .6; cursor: not-allowed; }

    .btn-refresh { background: #1e293b; }
    .btn-start { background: var(--accent); color: #052e16; }
    .btn-pause { background: #f59e0b; color: #1f1302; }
    .btn-reset { background: #334155; }
    .btn-save { background: var(--accent-2); }

    table { width: 100%; border-collapse: collapse; overflow: hidden; border-radius: 12px; }
    thead th { text-align: left; font-size: 13px; color: var(--muted); font-weight: 600; padding: 10px 12px; background: rgba(255,255,255,.04); }
    tbody td { padding: 12px; border-top: 1px solid rgba(255,255,255,.06); }
    tbody tr:hover { background: rgba(255,255,255,.02); }

    .rank { width: 40px; text-align: right; color: #cbd5e1; }
    .time { font-variant-numeric: tabular-nums; font-feature-settings: "tnum";
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }

    .pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; font-size: 12px; background: rgba(34,197,94,.18); color: #86efac; }

    .grid { display: grid; gap: 16px; grid-template-columns: 1.1fr .9fr; }
    @media (max-width: 860px) { .grid { grid-template-columns: 1fr; } }

    .panel-title { font-size: 18px; margin: 0 0 10px; }

    .stopwatch {
      display: grid; gap: 10px; align-items: center; justify-items: center;
      text-align: center;
    }
    .time-big { font-size: clamp(28px, 7vw, 64px); line-height: 1; font-weight: 700; letter-spacing: 1px; }
    .sw-actions { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; }

    .form { display: grid; gap: 8px; }
    .field { display: grid; gap: 6px; }
    label { font-size: 13px; color: var(--muted); }
    input[type="text"] {
      width: 100%; padding: 10px 12px; border-radius: 12px; background: #0b1220; color: var(--text); border: 1px solid rgba(255,255,255,.08);
    }

    .hint { color: var(--muted); font-size: 12px; }

    .loading { display: inline-flex; align-items: center; gap: 8px; color: var(--muted); font-size: 13px; }
    .dot { width: 8px; height: 8px; border-radius: 99px; background: var(--muted); animation: pulse 1.2s infinite; }
    .dot:nth-child(2){ animation-delay: .2s } .dot:nth-child(3){ animation-delay: .4s }
    @keyframes pulse { 0%, 60%, 100% { opacity: .2 } 30% { opacity: 1 } }

    .toast-wrap { position: fixed; inset: auto 0 18px 0; display: grid; place-items: center; pointer-events: none; }
    .toast { pointer-events: auto; background: #0b1220; border: 1px solid rgba(255,255,255,.1); color: var(--text); padding: 12px 14px; border-radius: 12px; box-shadow: var(--shadow); min-width: 260px; }
    .toast.success { border-color: rgba(34,197,94,.4); }
    .toast.error { border-color: rgba(239,68,68,.5); }
  </style>
</head>
<body>
  <main class="app">
    <header class="card" aria-labelledby="title">
      <h1 id="title">🏁 Leaderboard</h1>
      <p class="sub">Scores ordered by best (lowest) time. Add a new score with the stopwatch below.</p>

      <div class="toolbar" role="group" aria-label="Leaderboard controls">
        <button id="refreshBtn" class="btn btn-refresh" type="button">Refresh</button>
        <span id="loading" class="loading" hidden>
          <span class="dot" aria-hidden="true"></span>
          <span class="dot" aria-hidden="true"></span>
          <span class="dot" aria-hidden="true"></span>
          Loading...
        </span>
        <span id="lastUpdated" class="hint"></span>
        <span class="hint" style="margin-left:auto">API: <code>/api/v1/competitors</code></span>
      </div>

      <div class="table-wrap">
        <table aria-describedby="title">
          <thead>
            <tr>
              <th class="rank">#</th>
              <th>Name</th>
              <th id="timeHeader" style="cursor:pointer" title="Click to toggle sort">Time ▲</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody id="tbody"></tbody>
        </table>
      </div>
    </header>

    <section class="grid" aria-label="Record a new score">
      <section class="card">
        <h2 class="panel-title">⏱️ Stopwatch</h2>
        <div class="stopwatch">
          <div id="timeBig" class="time-big" aria-live="polite">00:00.000</div>
          <div class="sw-actions">
            <button id="startBtn" class="btn btn-start" aria-pressed="false">Start</button>
            <button id="pauseBtn" class="btn btn-pause" aria-pressed="false" disabled>Pause</button>
            <button id="resetBtn" class="btn btn-reset">Reset</button>
          </div>
        </div>
      </section>

      <section class="card">
        <h2 class="panel-title">📝 Save Score</h2>
        <form id="scoreForm" class="form" autocomplete="off">
          <div class="field">
            <label for="name">Name</label>
            <input id="name" name="name" type="text" placeholder="Player name" required />
          </div>
          <div class="field">
            <label for="elapsed">Current Time</label>
            <input id="elapsed" name="elapsed" type="text" readonly value="00:00.000" />
            <span class="hint">This is what will be saved.</span>
          </div>
          <button id="saveBtn" class="btn btn-save" type="submit" disabled>Save Score</button>
          <span class="hint">Tip: Your last name is remembered.</span>
        </form>
      </section>
    </section>
  </main>

  <div class="toast-wrap" aria-live="polite" aria-atomic="true"></div>

  <script>
  // ===== Config & Helpers =====
  const API_BASE = 'https://68c421e881ff90c8e61b57fe.mockapi.io/api/v1/competitors';

  const FIELD_MAP = {
    name: ['name', 'username', 'displayName'],
    timeMs: ['timeMs', 'time', 'duration', 'score', 'scoreTime'],
    createdAt: ['createdAt', 'created_at', 'date', 'timestamp']
  };

  function pickField(obj, keys, fallback = undefined) {
    for (const k of keys) if (k in obj && obj[k] != null) return obj[k];
    return fallback;
  }

  function normalizeItem(raw) {
    const name = String(pickField(raw, FIELD_MAP.name, '—'));
    const t = pickField(raw, FIELD_MAP.timeMs, 0);
    const timeMs = typeof t === 'string' ? Number(t) : Number(t || 0);
    const createdAt = pickField(raw, FIELD_MAP.createdAt, raw.createdAt || new Date().toISOString());
    return { id: raw.id ?? crypto.randomUUID?.() ?? String(Math.random()), name, timeMs, createdAt };
  }

  function pad(n, w = 2) { return String(n).padStart(w, '0'); }
  function formatMs(ms) {
    ms = Math.max(0, Math.floor(ms));
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    const milli = ms % 1000;
    return `${pad(m)}:${pad(s)}.${pad(milli, 3)}`;
  }
  function formatDate(iso) {
    try {
      const d = new Date(iso);
      const yyyy = d.getFullYear();
      const mm = pad(d.getMonth() + 1);
      const dd = pad(d.getDate());
      const hh = pad(d.getHours());
      const mi = pad(d.getMinutes());
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
    } catch { return iso; }
  }

  function showToast(type, message) {
    const wrap = document.querySelector('.toast-wrap');
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.setAttribute('role', 'status');
    el.textContent = message;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateY(6px)'; }, 2200);
    setTimeout(() => el.remove(), 2800);
  }

  // ===== Leaderboard fetching/rendering =====
  const tbody = document.getElementById('tbody');
  const loadingEl = document.getElementById('loading');
  const lastUpdatedEl = document.getElementById('lastUpdated');
  const timeHeader = document.getElementById('timeHeader');
  let sortAsc = true;

  async function fetchCompetitors() {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error(`Fetch failed (${res.status})`);
      const data = await res.json();
      const list = Array.isArray(data) ? data.map(normalizeItem) : [];
      list.sort((a, b) => sortAsc ? a.timeMs - b.timeMs : b.timeMs - a.timeMs);
      renderTable(list);
      lastUpdatedEl.textContent = `Updated ${new Date().toLocaleString()}`;
    } catch (e) {
      console.error(e);
      tbody.innerHTML = `<tr><td colspan="4">Could not load data. Please try again. <span class="hint">${e.message}</span></td></tr>`;
      showToast('error', 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }

  function renderTable(list) {
    if (!list.length) {
      tbody.innerHTML = `<tr><td class="rank">—</td><td colspan="3">No scores yet — be the first!</td></tr>`;
      return;
    }
    tbody.innerHTML = '';
    list.forEach((item, idx) => {
      const tr = document.createElement('tr');
      const rankTd = `<td class="rank">${idx + 1} ${idx === 0 ? '<span class="pill" title="Best time">#1</span>' : ''}</td>`;
      tr.innerHTML = `${rankTd}<td>${escapeHtml(item.name)}</td><td class="time">${formatMs(item.timeMs)}</td><td>${formatDate(item.createdAt)}</td>`;
      tbody.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function setLoading(v) { loadingEl.hidden = !v; }

  // Sort toggle
  timeHeader.addEventListener('click', () => {
    sortAsc = !sortAsc;
    timeHeader.textContent = `Time ${sortAsc ? '▲' : '▼'}`;
    fetchCompetitors();
  });

  // ===== Stopwatch =====
  const timeBig = document.getElementById('timeBig');
  const startBtn = document.getElementById('startBtn');
  const pauseBtn = document.getElementById('pauseBtn');
  const resetBtn = document.getElementById('resetBtn');

  let running = false;
  let base = 0; // accumulated ms when paused
  let lastTs = 0; // last performance.now while running
  let rafId = null;

  function tick(ts) {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    const delta = ts - lastTs;
    lastTs = ts;
    base += delta;
    updateDisplays(base);
    rafId = requestAnimationFrame(tick);
  }

  function updateDisplays(ms) {
    timeBig.textContent = formatMs(ms);
    elapsedInput.value = formatMs(ms);
    // enable save if name non-empty and time > 0
    saveBtn.disabled = !(nameInput.value.trim() && ms > 0);
  }

  function start() {
    if (running) return;
    running = true;
    startBtn.textContent = 'Start'; // default label for when toggled back
    startBtn.setAttribute('aria-pressed', 'true');
    pauseBtn.disabled = false;
    lastTs = 0;
    rafId = requestAnimationFrame(tick);
  }

  function pause() {
    if (!running) return;
    running = false;
    startBtn.setAttribute('aria-pressed', 'false');
    pauseBtn.disabled = true;
    if (rafId) cancelAnimationFrame(rafId);
  }

  function reset() {
    pause();
    base = 0; lastTs = 0; updateDisplays(0);
  }

  startBtn.addEventListener('click', start);
  pauseBtn.addEventListener('click', pause);
  resetBtn.addEventListener('click', reset);

  // ===== Save Score =====
  const form = document.getElementById('scoreForm');
  const nameInput = document.getElementById('name');
  const elapsedInput = document.getElementById('elapsed');
  const saveBtn = document.getElementById('saveBtn');
  const refreshBtn = document.getElementById('refreshBtn');

  // Persist last name
  nameInput.value = localStorage.getItem('lastName') || '';

  nameInput.addEventListener('input', () => {
    localStorage.setItem('lastName', nameInput.value);
    saveBtn.disabled = !(nameInput.value.trim() && base > 0);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    if (!name) return showToast('error', 'Please enter a name');
    if (base <= 0) return showToast('error', 'Time must be greater than 0');

    try {
      setFormBusy(true);
      const payload = { name, timeMs: Math.round(base) };
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      const saved = normalizeItem(await res.json());
      showToast('success', `Saved: ${saved.name} ${formatMs(saved.timeMs)}`);
      reset();
      // Keep name but allow user to change
      await fetchCompetitors();
    } catch (e) {
      console.error(e);
      showToast('error', e.message || 'Failed to save score');
    } finally {
      setFormBusy(false);
    }
  });

  function setFormBusy(busy) {
    [nameInput, saveBtn].forEach(el => el.disabled = busy);
    if (busy) saveBtn.textContent = 'Saving…'; else saveBtn.textContent = 'Save Score';
  }

  refreshBtn.addEventListener('click', fetchCompetitors);

  // ===== Init =====
  updateDisplays(0);
  fetchCompetitors();
  </script>
</body>
</html>