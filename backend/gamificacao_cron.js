// =====================================================
// DAFIX · Cron de gamificação
// - Decrementa fome/felicidade de hora em hora
// - Quebra streak após 48h (ou consome congelamento)
// - Aplica modificador de fome de itens equipados
// =====================================================
'use strict';
const cron = require('node-cron');
const db = require('./db');

const FOME_DECAY_BASE   = 4;   // pontos/hora
const FEL_DECAY_BASE    = 2;   // pontos/hora
const OFFLINE_MULT      = 2;   // penalidade após 24h offline
const HORA_MS           = 3600 * 1000;

function tick() {
  const sql = `
    SELECT g.*,
      (SELECT i.bonus_json
         FROM gamificacao_inventario inv
         JOIN gamificacao_item i ON i.id = inv.id_item
        WHERE inv.id_cliente = g.id_cliente
          AND inv.equipado = 1
          AND i.slot = 'corpo'
        LIMIT 1) AS corpo_bonus
    FROM gamificacao_perfil g
  `;

  db.all(sql, [], (err, rows) => {
    if (err) return console.error('[cron] read:', err.message);

    rows.forEach((p) => {
      // Fome com modificador (pijama reduz)
      let fomeRate = 1;
      try {
        const b = JSON.parse(p.corpo_bonus || '{}');
        if (typeof b.fome_rate === 'number') fomeRate = 1 + b.fome_rate;
      } catch { /* ignora */ }

      const ultima = p.ultima_interacao ? new Date(p.ultima_interacao).getTime() : 0;
      const offlineMs = Date.now() - ultima;
      const offlineMult = offlineMs > 24 * HORA_MS ? OFFLINE_MULT : 1;

      let fome = Math.max(0, p.pet_fome - Math.round(FOME_DECAY_BASE * fomeRate * offlineMult));
      let fel  = Math.max(0, p.pet_felicidade - Math.round(FEL_DECAY_BASE * offlineMult));
      if (fome === 0) fel = Math.max(0, fel - 2);           // fome zero dói na felicidade

      // Streak
      let streak = p.streak_atual;
      let congel = p.congelamentos;
      let perdeuStreak = false;
      let congelou = false;

      if (ultima && offlineMs > 48 * HORA_MS) {
        if (congel > 0) { congel--; congelou = true; }
        else if (streak > 0) { streak = 0; perdeuStreak = true; }
      }

      db.run(`
        UPDATE gamificacao_perfil
           SET pet_fome = ?, pet_felicidade = ?,
               streak_atual = ?, congelamentos = ?,
               atualizado_em = datetime('now')
         WHERE id = ?
      `, [fome, fel, streak, congel, p.id], (e) => {
        if (e) console.error('[cron] update:', e.message);
        if (perdeuStreak) console.log(`[cron] streak perdido: cliente ${p.id_cliente}`);
        if (congelou)    console.log(`[cron] congelamento usado: cliente ${p.id_cliente}`);
      });
    });
  });
}

function iniciar() {
  cron.schedule('0 * * * *', tick);      // de hora em hora
  setTimeout(tick, 5000);                // tick logo após subir
  console.log('[cron] gamificação ativa (tick 1h).');
}

module.exports = { iniciar, tick };