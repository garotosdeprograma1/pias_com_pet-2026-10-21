// gamificacao_db.js — helpers de domínio
'use strict';
const db = require('./db');

const XP_POR_NIVEL = (nivel) => 100 + (nivel - 1) * 50; // curva
const DIAS = 24 * 60 * 60 * 1000;

function agoraIso() { return new Date().toISOString(); }

// Garante que o cliente tem perfil de gamificação
function garantirPerfil(idCliente, cb) {
  db.get('SELECT id FROM gamificacao_perfil WHERE id_cliente = ?', [idCliente], (err, row) => {
    if (err) return cb(err);
    if (row) return cb(null, row.id);
    db.run(
      'INSERT INTO gamificacao_perfil (id_cliente) VALUES (?)',
      [idCliente],
      function (e) { cb(e, this.lastID); }
    );
  });
}

// Aplica modificadores de itens equipados
function aplicarBonus(itens, base) {
  let out = { ...base };
  itens.forEach(it => {
    let b = {};
    try { b = JSON.parse(it.bonus_json || '{}'); } catch {}
    if (b.drop_raro)         out.drop_raro       = (out.drop_raro || 0) + b.drop_raro;
    if (b.fome_rate)         out.fome_rate       = (out.fome_rate || 1) + b.fome_rate;
    if (b.xp_bonus)          out.xp_bonus        = (out.xp_bonus || 1) + b.xp_bonus;
    if (b.felicidade_bonus)  out.felicidade_bonus = (out.felicidade_bonus || 0) + b.felicidade_bonus;
    if (b.felicidade_rate)   out.felicidade_rate = (out.felicidade_rate || 1) + b.felicidade_rate;
  });
  return out;
}

function itensEquipados(idCliente, cb) {
  db.all(`
    SELECT i.* FROM gamificacao_inventario inv
    INNER JOIN gamificacao_item i ON i.id = inv.id_item
    WHERE inv.id_cliente = ? AND inv.equipado = 1
  `, [idCliente], cb);
}

// Atualiza streak com base no tempo desde a última interação
function calcularStreak(perfil, agora = Date.now()) {
  const ultima = perfil.ultima_interacao ? new Date(perfil.ultima_interacao).getTime() : 0;
  const delta = agora - ultima;

  if (delta < DIAS) {
    return { streak: perfil.streak_atual, perdeu: false, congelou: false };
  }
  if (delta < 2 * DIAS) {
    return { streak: perfil.streak_atual + 1, perdeu: false, congelou: false };
  }
  // > 48h — tenta congelar se tiver item
  if (perfil.congelamentos > 0) {
    return { streak: perfil.streak_atual, perdeu: false, congelou: true, novosCongelamentos: perfil.congelamentos - 1 };
  }
  return { streak: 0, perdeu: true, congelou: false };
}

module.exports = { garantirPerfil, aplicarBonus, itensEquipados, calcularStreak, XP_POR_NIVEL, agoraIso };