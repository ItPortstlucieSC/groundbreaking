/**
 * Groundbreaking · backend mínimo sobre Google Sheets (Apps Script, web app).
 *
 * Pestañas: "messages" (muro) y "registrations" (postales). Cómo desplegar: docs/wall/README.md.
 *   GET  ?action=messages → { ok, messages: [{ id, t, n, b, stk }] } (solo status = approved)
 *   POST body JSON { type: 'message' | 'register', ... }  → { ok, id, status }
 *
 * Moderación: los mensajes se publican al instante (status "approved") y el sitio muestra SOLO los "approved".
 * Para sacar uno del muro basta cambiarle el status en el Sheet (p. ej. "hidden"): desaparece en la próxima carga.
 * La política vive en la pestaña "config" (auto_approve = TRUE/FALSE), así se cambia sin volver a desplegar.
 */
var AUTO_APPROVE_DEFAULT = true;
var STATUSES = ['approved', 'hidden', 'pending'];
var MAX_TEXT = 140, MAX_NAME = 40;
var BADGES = ['Supporter', 'Neighbor', 'Academy family', 'Academy', 'Founding Crew'];
var STICKERS = ['anchor', 'ball', 'drum', 'heart', 'palm', 'pirate', 'shovel', 'star', 'luca'];
var COLS = {
  messages: ['id', 'timestamp', 'status', 'display_name', 'badge', 'sticker', 'message', 'is_adult', 'email', 'consent', 'lang', 'page', 'user_agent'],
  registrations: ['id', 'timestamp', 'postcard', 'name', 'email', 'digital_only', 'street', 'city', 'state', 'zip', 'lang', 'page', 'user_agent']
};

/** Correr desde el editor (se puede repetir sin romper nada): pestañas, encabezados, desplegable de status y config. */
function setup() {
  var ss = SpreadsheetApp.getActive();
  Object.keys(COLS).forEach(function (name) {
    var sh = ss.getSheetByName(name) || ss.insertSheet(name);
    if (sh.getLastRow() === 0) { sh.appendRow(COLS[name]); sh.setFrozenRows(1); }
  });
  // status: desplegable approved / hidden / pending (cualquier valor distinto de approved oculta el mensaje)
  var msgs = ss.getSheetByName('messages'), col = COLS.messages.indexOf('status') + 1;
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(true).build();
  msgs.getRange(2, col, msgs.getMaxRows() - 1, 1).setDataValidation(rule);
  var cfg = ss.getSheetByName('config') || ss.insertSheet('config');
  if (cfg.getLastRow() === 0) {
    cfg.appendRow(['auto_approve', AUTO_APPROVE_DEFAULT, 'TRUE = los mensajes salen al muro al instante · FALSE = entran como pending y se publican al poner approved']);
    cfg.appendRow(['', '', 'Para sacar un mensaje del muro: en la pestaña messages, columna status, elegir hidden.']);
    cfg.setColumnWidth(3, 620);
  }
}

/** Corre setup() una sola vez, solo, la primera vez que llega un envío (sin pestaña config todavía). */
function ensureSetup_() {
  if (!SpreadsheetApp.getActive().getSheetByName('config')) setup();
}

/** Lee auto_approve de la pestaña config (cacheado 30 s). Sin pestaña, vale AUTO_APPROVE_DEFAULT. */
function autoApprove_() {
  var cache = CacheService.getScriptCache(), c = cache.get('cfg:auto_approve');
  if (c !== null) return c === '1';
  var v = AUTO_APPROVE_DEFAULT, sh = SpreadsheetApp.getActive().getSheetByName('config');
  if (sh && sh.getLastRow() >= 1) {
    sh.getRange(1, 1, sh.getLastRow(), 2).getValues().forEach(function (r) {
      if (String(r[0]).trim() === 'auto_approve') v = (r[1] === true) || /^(true|1|yes|si|sí)$/i.test(String(r[1]).trim());
    });
  }
  cache.put('cfg:auto_approve', v ? '1' : '0', 30);
  return v;
}

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || 'messages';
  if (action !== 'messages') return json_({ ok: false, error: 'unknown action' });
  return json_({ ok: true, messages: approvedMessages_() });
}

function doPost(e) {
  var d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return json_({ ok: false, error: 'bad json' }); }
  if (d.hp) return json_({ ok: true, id: null, status: 'pending' }); // honeypot: a los bots les decimos que sí
  var email = clean_(d.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'Please enter a valid email.' });
  var cache = CacheService.getScriptCache(), key = 'rl:' + (d.type || '') + ':' + md5_(email);
  if (cache.get(key)) return json_({ ok: false, error: 'Easy there. Try again in a minute.' });
  cache.put(key, '1', 60);

  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    ensureSetup_();
    if (d.type === 'message') return json_(saveMessage_(d, email));
    if (d.type === 'register') return json_(saveRegistration_(d, email));
    return json_({ ok: false, error: 'unknown type' });
  } finally { lock.releaseLock(); }
}

function saveMessage_(d, email) {
  var text = clean_(d.text, MAX_TEXT);
  if (text.length < 3) return { ok: false, error: 'Finish the sentence first.' };
  if (!d.consent) return { ok: false, error: 'We need your OK to show the message.' };
  if (!d.adult) return { ok: false, error: 'You need to be 18 or older to leave a message.' };
  var badge = BADGES.indexOf(d.badge) > -1 ? d.badge : 'Supporter';
  var sticker = STICKERS.indexOf(d.sticker) > -1 ? d.sticker : 'anchor';
  var status = autoApprove_() ? 'approved' : 'pending';
  var id = Utilities.getUuid();
  sheet_('messages').appendRow([id, new Date(), status, clean_(d.name, MAX_NAME) || 'Anonymous', badge, sticker, text,
    true, email, true, clean_(d.lang, 5), clean_(d.page, 80), clean_(d.ua, 160)]);
  return { ok: true, id: id, status: status };
}

function saveRegistration_(d, email) {
  var postcard = parseInt(d.postcard, 10);
  if (!(postcard >= 1 && postcard <= 4)) return { ok: false, error: 'Pick a postcard first.' };
  var name = clean_(d.name, MAX_NAME); if (!name) return { ok: false, error: 'We need a name for the postcard.' };
  var digital = !!d.digital_only;
  if (!digital && !(clean_(d.street, 120) && clean_(d.city, 60) && clean_(d.zip, 12))) return { ok: false, error: 'We need the address for the printed postcard.' };
  var id = Utilities.getUuid();
  sheet_('registrations').appendRow([id, new Date(), postcard, name, email, digital,
    digital ? '' : clean_(d.street, 120), digital ? '' : clean_(d.city, 60), digital ? '' : clean_(d.state, 30), digital ? '' : clean_(d.zip, 12),
    clean_(d.lang, 5), clean_(d.page, 80), clean_(d.ua, 160)]);
  return { ok: true, id: id, status: 'saved' };
}

function approvedMessages_() {
  var sh = sheet_('messages'); if (sh.getLastRow() < 2) return [];
  var H = COLS.messages, col = function (k) { return H.indexOf(k); };
  var rows = sh.getRange(2, 1, sh.getLastRow() - 1, H.length).getValues();
  return rows.filter(function (r) { return String(r[col('status')]).toLowerCase().trim() === 'approved'; })
    .map(function (r) { return { id: r[col('id')], t: r[col('message')], n: r[col('display_name')], b: r[col('badge')], stk: r[col('sticker')] }; });
}

function sheet_(name) {
  var sh = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sh) { setup(); sh = SpreadsheetApp.getActive().getSheetByName(name); }
  return sh;
}
function clean_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max); }
function md5_(s) { return Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s).map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join(''); }
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
