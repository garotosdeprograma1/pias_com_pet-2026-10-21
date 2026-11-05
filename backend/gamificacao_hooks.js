// =====================================================
// DAFIX · Hooks automáticos de gamificação
// Eventos do app → tarefas concluídas → XP + moedas
// =====================================================
'use strict';
const db = require('./db');

const MAPA = {
  criou_pedido:    'criar_pedido',
  avaliou_servico: 'avaliar',
  perfil_completo: 'perfil_ok',
  checkin_diario:  'checkin',
  premium_daily:   'missao_premium'
};

const XP_POR_NIVEL = (n) => 100 + (n - 1) * 50;

function garantirPerfil(idCliente, cb) {
  db.get('SELECT * FROM gamificacao_perfil WHERE id_cliente = ?', [idCliente], (e, p) => {
    if (e) return cb(e);
    if (p) return cb(null, p);
    db.run('INSERT INTO gamificacao_perfil (id_cliente) VALUES (?)', [idCliente], (e2) => {
      if (e2) return cb(e2);
      db.get('SELECT * FROM gamificacao_perfil WHERE id_cliente = ?', [idCliente], cb);
    });
  });
}

function disparar(evento, idCliente, cb = () => {}) {
  const slug = MAPA[evento];
  if (!slug) return cb();
  if (!idCliente) return cb();

  db.get('SELECT * FROM gamificacao_tarefa WHERE slug = ? AND ativa = 1', [slug], (e, tarefa) => {
    if (e || !tarefa) return cb();

    db.get(`
      SELECT MAX(concluida_em) AS ult
        FROM gamificacao_tarefa_log
       WHERE id_cliente = ? AND id_tarefa = ?
    `, [idCliente, tarefa.id], (e2, row) => {
      if (e2) return cb();
      const ult = row && row.ult ? new Date(row.ult).getTime() : 0;
      if (ult && Date.now() - ult < tarefa.cooldown_horas * 3600 * 1000) return cb(); // em cooldown

      garantirPerfil(idCliente, (e3, perfil) => {
        if (e3) return cb(e3);
        let xp = perfil.pet_xp + tarefa.recompensa_xp;
        let nivel = perfil.pet_nivel;
        while (xp >= XP_POR_NIVEL(nivel)) { xp -= XP_POR_NIVEL(nivel); nivel++; }

        db.run(`
          UPDATE gamificacao_perfil
             SET pet_xp = ?, pet_nivel = ?, moedas = moedas + ?,
                 atualizado_em = datetime('now')
           WHERE id = ?
        `, [xp, nivel, tarefa.recompensa_moedas, perfil.id], (e4) => {
          if (e4) return cb(e4);
          db.run(
            'INSERT INTO gamificacao_tarefa_log (id_cliente, id_tarefa) VALUES (?, ?)',
            [idCliente, tarefa.id], (e5) => cb(e5)
          );
        });
      });
    });
  });
}

module.exports = { disparar, MAPA };