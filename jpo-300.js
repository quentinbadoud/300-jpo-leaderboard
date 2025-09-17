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