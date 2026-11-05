// =====================================================
// DAFIX · Sessões (cookie HttpOnly + SQLite)
// =====================================================
'use strict';
const crypto = require('crypto');
const db = require('./db');

const DIAS = 7;
const COOKIE_NAME = 'dafix_sid';

function criar(id, perfil, cb) {
  const sid = crypto.randomBytes(32).toString('hex');
  const expira = new Date(Date.now() + DIAS * 24 * 3600 * 1000).toISOString();
  const idCliente = perfil === 'cliente' ? id : null;
  const idFunc    = perfil === 'funcionario' ? id : null;
  db.run(`
    INSERT INTO sessao (sid, id_cliente, id_funcionario, perfil, expira_em)
    VALUES (?, ?, ?, ?, ?)
  `, [sid, idCliente, idFunc, perfil, expira], (e) => cb(e, sid, expira));
}

function validar(sid, cb) {
  if (!sid) return cb(null, null);
  db.get('SELECT * FROM sessao WHERE sid = ?', [sid], (e, s) => {
    if (e || !s) return cb(null, null);
    if (new Date(s.expira_em).getTime() < Date.now()) {
      db.run('DELETE FROM sessao WHERE sid = ?', [sid]);
      return cb(null, null);
    }
    cb(null, s);
  });
}

function destruir(sid, cb) {
  if (!sid) return cb();
  db.run('DELETE FROM sessao WHERE sid = ?', [sid], cb);
}

function cookieHeader(sid, expira) {
  const maxAge = Math.floor((new Date(expira).getTime() - Date.now()) / 1000);
  return `${COOKIE_NAME}=${sid}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function cookieClear() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

function lerCookie(req) {
  const h = req.headers.cookie || '';
  const m = h.match(new RegExp('(?:^|;\\s*)' + COOKIE_NAME + '=([^;]+)'));
  return m ? m[1] : null;
}

// Resolve a sessão a partir do cookie e devolve { perfil, id } ou null
function resolver(req, cb) {
  const sid = lerCookie(req);
  if (!sid) return cb(null, null);
  validar(sid, (e, s) => {
    if (e || !s) return cb(null, null);
    const id = s.perfil === 'cliente' ? s.id_cliente : s.id_funcionario;
    cb(null, { perfil: s.perfil, id, sid: s.sid });
  });
}

module.exports = { criar, validar, destruir, cookieHeader, cookieClear, lerCookie, resolver, COOKIE_NAME };