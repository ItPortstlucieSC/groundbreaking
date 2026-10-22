// Imitación local del web app de Apps Script (docs/wall/Code.gs) para probar la v2 sin deploy.
//   node docs/wall/mock-server.mjs            → http://localhost:4322  (aprueba todo; ?auto=0 deja los mensajes en pending)
//   luego abrir  http://localhost:4321/v2/?api=http://localhost:4322
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const PORT = +(process.env.PORT || 4322);
const FILE = process.env.FILE || path.join(os.tmpdir(), 'groundbreaking-mock.json');
let db = { messages: [], registrations: [] };
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch {}
const save = () => fs.writeFileSync(FILE, JSON.stringify(db, null, 1));
const H = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
http.createServer((req, res) => {
  let body = ''; req.on('data', c => body += c); req.on('end', () => {
    const url = new URL(req.url, 'http://x'); const auto = url.searchParams.get('auto') !== '0';
    if (req.method === 'GET') { res.writeHead(200, H); return res.end(JSON.stringify({ ok: true, messages: db.messages.filter(m => m.status === 'approved').map(({ id, t, n, b, stk }) => ({ id, t, n, b, stk })) })); }
    if (req.method !== 'POST') { res.writeHead(405, H); return res.end('{"ok":false}'); }
    let d; try { d = JSON.parse(body); } catch { res.writeHead(200, H); return res.end('{"ok":false,"error":"bad json"}'); }
    const id = 'mock-' + Date.now();
    if (d.hp) { res.writeHead(200, H); return res.end(JSON.stringify({ ok: true, id: null, status: 'pending' })); }
    if (d.type === 'message') { const status = auto ? 'approved' : 'pending'; db.messages.push({ id, status, t: d.text, n: d.name, b: d.badge, stk: d.sticker, raw: d, at: new Date().toISOString() }); save(); res.writeHead(200, H); return res.end(JSON.stringify({ ok: true, id, status })); }
    if (d.type === 'register') { db.registrations.push({ id, raw: d, at: new Date().toISOString() }); save(); res.writeHead(200, H); return res.end(JSON.stringify({ ok: true, id, status: 'saved' })); }
    res.writeHead(200, H); res.end('{"ok":false,"error":"unknown type"}');
  });
}).listen(PORT, () => console.log('mock API ' + FILE + ' on http://localhost:' + PORT));
