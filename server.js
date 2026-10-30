// Review board server: serves the master board (/) and team buzzer page (/buzz),
// and orders buzzes by the time they reach this server.
const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PIN = process.env.HOST_PIN || '';          // optional: master must open /?pin=XXXX
const PUB = path.join(__dirname, 'public');
const PAGES = { '/': 'index.html', '/index.html': 'index.html', '/buzz': 'buzz.html', '/buzz.html': 'buzz.html' };

const server = http.createServer((req, res) => {
  const p = new URL(req.url, 'http://x').pathname;
  if (p === '/healthz') { res.end('ok'); return; }
  const f = PAGES[p];
  if (!f) { res.writeHead(404); res.end('Not found'); return; }
  fs.readFile(path.join(PUB, f), (err, buf) => {
    if (err) { res.writeHead(500); res.end('Error'); return; }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
});

const wss = new WebSocketServer({ server, path: '/ws' });
const st = { teams: [], open: false, locked: [], queue: [] };
const clients = new Set();

function view() {
  const online = st.teams.map((_, i) => [...clients].filter(c => c.team === i && c.readyState === 1).length);
  return JSON.stringify({ t: 'state', teams: st.teams.map((t, i) => ({ name: t.name, score: t.score, n: online[i] })),
                          open: st.open, locked: st.locked, queue: st.queue });
}
function broadcast() { const m = view(); for (const c of clients) if (c.readyState === 1) c.send(m); }

wss.on('connection', ws => {
  ws.host = false; ws.team = null; ws.isAlive = true;
  clients.add(ws);
  ws.on('pong', () => { ws.isAlive = true; });
  ws.send(view());
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'host') { ws.host = (!PIN || m.pin === PIN); ws.send(JSON.stringify({ t: 'hostok', ok: ws.host })); return; }
    if (m.t === 'join') {
      const i = Number(m.team);
      ws.team = Number.isInteger(i) && i >= 0 && i < st.teams.length ? i : null;
      broadcast(); return;
    }
    if (m.t === 'buzz') {
      const i = ws.team;
      if (st.open && i !== null && !st.locked.includes(i) && !st.queue.includes(i)) { st.queue.push(i); broadcast(); }
      return;
    }
    if (!ws.host) return;
    if (m.t === 'sync') {
      const teams = Array.isArray(m.teams) ? m.teams.slice(0, 8).map(t => ({ name: String(t.name || '').slice(0, 24), score: Number(t.score) || 0 })) : [];
      const opening = !!m.open && !st.open;
      st.teams = teams;
      st.open = !!m.open;
      st.locked = Array.isArray(m.locked) ? m.locked.filter(Number.isInteger) : [];
      if (opening || !st.open) st.queue = [];
      st.queue = st.queue.filter(i => !st.locked.includes(i) && i < teams.length);
      for (const c of clients) if (c.team !== null && c.team >= teams.length) c.team = null;
      broadcast(); return;
    }
    if (m.t === 'queue' && Array.isArray(m.queue)) {
      st.queue = m.queue.filter(i => Number.isInteger(i) && i >= 0 && i < st.teams.length);
      broadcast(); return;
    }
  });
  ws.on('close', () => { clients.delete(ws); broadcast(); });
});

setInterval(() => {            // drop dead phones so team counts stay honest
  for (const c of clients) { if (!c.isAlive) { c.terminate(); continue; } c.isAlive = false; try { c.ping(); } catch {} }
}, 15000);

server.listen(PORT, () => console.log('Review board on http://localhost:' + PORT + '  (teams: /buzz)' + (PIN ? '  host PIN required' : '')));
