// gamificacao.js — router de gamificação
'use strict';
const {
  garantirPerfil, aplicarBonus, itensEquipados,
  calcularStreak, XP_POR_NIVEL, agoraIso
} = require('./gamificacao_db');
const db = require('./db');

function ok(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
function fail(res, status, msg) { ok(res, { erro: msg }, status); }

function lerCorpo(req, cb) {
  let b = '';
  req.on('data', c => b += c);
  req.on('end', () => {
    try { cb(null, b ? JSON.parse(b) : {}); }
    catch (e) { cb(e); }
  });
}

// Detecta se o cliente tem perfil "premium" (heurística — ajuste à sua regra)
function isPremium(idCliente, cb) {
  // Ajuste: aqui você pode checar uma tabela de assinatura.
  // Como ponto de partida, todo cliente é free; funcionário/admin seria premium.
  cb(null, false);
}

// ---------------- GET /api/gamificacao/status ----------------
function getStatus(req, res, idCliente) {
  garantirPerfil(idCliente, (err, idPerfil) => {
    if (err) return fail(res, 500, err.message);

    db.get('SELECT * FROM gamificacao_perfil WHERE id = ?', [idPerfil], (e, perfil) => {
      if (e) return fail(res, 500, e.message);

      itensEquipados(idCliente, (e2, itens) => {
        if (e2) return fail(res, 500, e2.message);
        const bonus = aplicarBonus(itens, {});

        db.all('SELECT * FROM gamificacao_tarefa WHERE ativa = 1 ORDER BY tipo, id', (e3, tarefas) => {
          if (e3) return fail(res, 500, e3.message);

          isPremium(idCliente, (e4, premium) => {
            if (e4) return fail(res, 500, e4.message);

            const tarefasVisiveis = tarefas.filter(t => t.tipo === 'comum' || premium);

            // Para cada tarefa, checa cooldown
            const agora = Date.now();
            let pendentes = tarefasVisiveis.length;
            const tarefasComEstado = [];
            if (pendentes === 0) {
              return ok(res, { perfil, itens, bonus, premium, tarefas: [] });
            }
            tarefasVisiveis.forEach(t => {
              db.get(
                'SELECT MAX(concluida_em) AS ult FROM gamificacao_tarefa_log WHERE id_cliente = ? AND id_tarefa = ?',
                [idCliente, t.id],
                (e5, row) => {
                  if (e5) return fail(res, 500, e5.message);
                  const ult = row && row.ult ? new Date(row.ult).getTime() : 0;
                  const disponivel = !ult || (agora - ult) >= t.cooldown_horas * 3600 * 1000;
                  tarefasComEstado.push({ ...t, disponivel });
                  if (--pendentes === 0) {
                    ok(res, { perfil, itens, bonus, premium, tarefas: tarefasComEstado });
                  }
                }
              );
            });
          });
        });
      });
    });
  });
}

// ---------------- POST /api/gamificacao/checkin ----------------
function postCheckin(req, res, idCliente) {
  garantirPerfil(idCliente, (err, idPerfil) => {
    if (err) return fail(res, 500, err.message);
    db.get('SELECT * FROM gamificacao_perfil WHERE id = ?', [idPerfil], (e, p) => {
      if (e) return fail(res, 500, e.message);
      const r = calcularStreak(p);
      const novoStreak = r.streak;
      const novoRecorde = Math.max(p.streak_recorde, novoStreak);
      const novosCongelamentos = r.congelou ? r.novosCongelamentos : p.congelamentos;

      db.run(
        `UPDATE gamificacao_perfil
           SET streak_atual = ?, streak_recorde = ?, ultima_interacao = ?,
               congelamentos = ?, atualizado_em = ?
         WHERE id = ?`,
        [novoStreak, novoRecorde, agoraIso(), novosCongelamentos, agoraIso(), idPerfil],
        (e2) => {
          if (e2) return fail(res, 500, e2.message);
          ok(res, {
            streak: novoStreak,
            recorde: novoRecorde,
            perdeu: r.perdeu,
            congelou: r.congelou,
            congelamentos: novosCongelamentos
          });
        }
      );
    });
  });
}

// ---------------- POST /api/gamificacao/alimentar ----------------
// body: { comida: 'basica'|'rara', custo: 10|25 }
function postAlimentar(req, res, idCliente) {
  lerCorpo(req, (e0, body) => {
    if (e0) return fail(res, 400, 'JSON inválido');
    const tipo = body.comida || 'basica';
    const custo = tipo === 'rara' ? 25 : 10;
    const xpGanho = tipo === 'rara' ? 30 : 10;
    const fomeDelta = tipo === 'rara' ? 25 : 15;
    const felDelta  = tipo === 'rara' ? 10 : 5;

    garantirPerfil(idCliente, (err, idPerfil) => {
      if (err) return fail(res, 500, err.message);
      db.get('SELECT * FROM gamificacao_perfil WHERE id = ?', [idPerfil], (e, p) => {
        if (e) return fail(res, 500, e.message);
        if (p.moedas < custo) return fail(res, 400, 'Moedas insuficientes');

        let xp = p.pet_xp + xpGanho;
        let nivel = p.pet_nivel;
        let subiuNivel = false;
        while (xp >= XP_POR_NIVEL(nivel)) {
          xp -= XP_POR_NIVEL(nivel);
          nivel++;
          subiuNivel = true;
        }
        const fome = Math.min(100, p.pet_fome + fomeDelta);
        const fel  = Math.min(100, p.pet_felicidade + felDelta);

        db.run(
          `UPDATE gamificacao_perfil
             SET pet_xp = ?, pet_nivel = ?, pet_fome = ?, pet_felicidade = ?,
                 moedas = moedas - ?, atualizado_em = ?
           WHERE id = ?`,
          [xp, nivel, fome, fel, custo, agoraIso(), idPerfil],
          (e2) => {
            if (e2) return fail(res, 500, e2.message);
            ok(res, {
              pet: { nivel, xp, fome, felicidade: fel },
              moedas: p.moedas - custo,
              subiuNivel,
              xpGanho
            });
          }
        );
      });
    });
  });
}

// ---------------- POST /api/gamificacao/tarefa/:id ----------------
function postTarefa(req, res, idCliente, idTarefa) {
  garantirPerfil(idCliente, (err, idPerfil) => {
    if (err) return fail(res, 500, err.message);
    db.get('SELECT * FROM gamificacao_tarefa WHERE id = ? AND ativa = 1', [idTarefa], (e, t) => {
      if (e) return fail(res, 500, e.message);
      if (!t) return fail(res, 404, 'Tarefa não encontrada');

      isPremium(idCliente, (e2, premium) => {
        if (t.tipo === 'premium' && !premium) return fail(res, 403, 'Tarefa premium');

        db.get(
          'SELECT MAX(concluida_em) AS ult FROM gamificacao_tarefa_log WHERE id_cliente = ? AND id_tarefa = ?',
          [idCliente, t.id],
          (e3, row) => {
            const ult = row && row.ult ? new Date(row.ult).getTime() : 0;
            if (ult && Date.now() - ult < t.cooldown_horas * 3600 * 1000) {
              return fail(res, 429, 'Tarefa em cooldown');
            }
            itensEquipados(idCliente, (e4, itens) => {
              const bonus = aplicarBonus(itens, {});
              const xp = Math.round(t.recompensa_xp * (bonus.xp_bonus || 1));
              const moedas = t.recompensa_moedas;

              db.get('SELECT * FROM gamificacao_perfil WHERE id = ?', [idPerfil], (e5, p) => {
                if (e5) return fail(res, 500, e5.message);
                let novoXp = p.pet_xp + xp;
                let nivel = p.pet_nivel;
                let subiu = false;
                while (novoXp >= XP_POR_NIVEL(nivel)) {
                  novoXp -= XP_POR_NIVEL(nivel);
                  nivel++;
                  subiu = true;
                }

                db.run(
                  `UPDATE gamificacao_perfil
                     SET pet_xp = ?, pet_nivel = ?, moedas = moedas + ?, atualizado_em = ?
                   WHERE id = ?`,
                  [novoXp, nivel, moedas, agoraIso(), idPerfil],
                  (e6) => {
                    if (e6) return fail(res, 500, e6.message);
                    db.run(
                      'INSERT INTO gamificacao_tarefa_log (id_cliente, id_tarefa) VALUES (?, ?)',
                      [idCliente, t.id],
                      (e7) => {
                        if (e7) return fail(res, 500, e7.message);
                        ok(res, {
                          tarefa: t.slug,
                          xpGanho: xp,
                          moedasGanhas: moedas,
                          pet: { nivel, xp: novoXp },
                          subiuNivel: subiu
                        });
                      }
                    );
                  }
                );
              });
            });
          }
        );
      });
    });
  });
}

// ---------------- GET /api/gamificacao/loja ----------------
function getLoja(req, res, idCliente) {
  isPremium(idCliente, (e, premium) => {
    if (e) return fail(res, 500, e.message);
    db.all('SELECT * FROM gamificacao_item ORDER BY premium_only, preco_moedas', (e2, itens) => {
      if (e2) return fail(res, 500, e2.message);
      db.all('SELECT id_item FROM gamificacao_inventario WHERE id_cliente = ?', [idCliente], (e3, inv) => {
        if (e3) return fail(res, 500, e3.message);
        const possuidos = new Set(inv.map(r => r.id_item));
        ok(res, {
          premium,
          itens: itens.map(i => ({
            ...i,
            bonus: JSON.parse(i.bonus_json || '{}'),
            possui: possuidos.has(i.id),
            bloqueado_premium: i.premium_only && !premium
          }))
        });
      });
    });
  });
}

// ---------------- POST /api/gamificacao/comprar/:idItem ----------------
function postComprar(req, res, idCliente, idItem) {
  garantirPerfil(idCliente, (err, idPerfil) => {
    if (err) return fail(res, 500, err.message);
    db.get('SELECT * FROM gamificacao_item WHERE id = ?', [idItem], (e, it) => {
      if (e) return fail(res, 500, e.message);
      if (!it) return fail(res, 404, 'Item não encontrado');
      isPremium(idCliente, (e2, premium) => {
        if (it.premium_only && !premium) return fail(res, 403, 'Item premium');
        db.get('SELECT * FROM gamificacao_perfil WHERE id = ?', [idPerfil], (e3, p) => {
          if (e3) return fail(res, 500, e3.message);
          if (p.moedas < it.preco_moedas) return fail(res, 400, 'Moedas insuficientes');
          db.run(
            'INSERT OR IGNORE INTO gamificacao_inventario (id_cliente, id_item) VALUES (?, ?)',
            [idCliente, it.id],
            (e4) => {
              if (e4) return fail(res, 500, e4.message);
              db.run(
                'UPDATE gamificacao_perfil SET moedas = moedas - ?, atualizado_em = ? WHERE id = ?',
                [it.preco_moedas, agoraIso(), idPerfil],
                (e5) => {
                  if (e5) return fail(res, 500, e5.message);
                  ok(res, { comprado: it.slug, moedas: p.moedas - it.preco_moedas });
                }
              );
            }
          );
        });
      });
    });
  });
}

// ---------------- POST /api/gamificacao/equipar/:idItem ----------------
function postEquipar(req, res, idCliente, idItem) {
  db.get('SELECT * FROM gamificacao_item WHERE id = ?', [idItem], (e, it) => {
    if (e) return fail(res, 500, e.message);
    if (!it) return fail(res, 404, 'Item não encontrado');
    db.get(
      'SELECT id FROM gamificacao_inventario WHERE id_cliente = ? AND id_item = ?',
      [idCliente, idItem],
      (e2, inv) => {
        if (e2) return fail(res, 500, e2.message);
        if (!inv) return fail(res, 400, 'Você não possui este item');
        // Desequipa o mesmo slot e equipa o novo
        db.run(
          `UPDATE gamificacao_inventario
             SET equipado = 0
           WHERE id_cliente = ? AND id_item IN (
             SELECT id FROM gamificacao_item WHERE slot = ?
           )`,
          [idCliente, it.slot],
          (e3) => {
            if (e3) return fail(res, 500, e3.message);
            db.run(
              'UPDATE gamificacao_inventario SET equipado = 1 WHERE id = ?',
              [inv.id],
              (e4) => {
                if (e4) return fail(res, 500, e4.message);
                ok(res, { equipado: it.slug });
              }
            );
          }
        );
      }
    );
  });
}

// ---------------- GET /api/gamificacao/ranking ----------------
function getRanking(req, res) {
  db.all(`
    SELECT c.id, c.nome AS cliente, g.pet_nome, g.pet_nivel, g.pet_xp,
           g.streak_atual AS streak, g.streak_recorde AS recorde
    FROM gamificacao_perfil g
    INNER JOIN cliente c ON c.id = g.id_cliente
    ORDER BY g.pet_nivel DESC, g.streak_atual DESC, g.pet_xp DESC
    LIMIT 100
  `, [], (e, rows) => {
    if (e) return fail(res, 500, e.message);
    ok(res, { ranking: rows.map((r, i) => ({ posicao: i + 1, ...r })) });
  });
}

// ---------------- ROUTER ----------------
// Uso: no server.js, antes do fallback estático:
//   if (gamificacao.handle(req, res)) return;
function handle(req, res) {
  const url = req.url.split('?')[0];
  const m = req.method;

  if (!url.startsWith('/api/gamificacao/')) return false;

  // Resolve sessão de forma assíncrona; se não houver, cai para header (retrocompat em dev)
  const sessoes = require('./sessoes');
  const u = new URL(req.url, 'http://x');
  const idDev = Number(req.headers['x-cliente-id'] || u.searchParams.get('id_cliente') || 0);

  sessoes.resolver(req, (e, sess) => {
    const idCliente = (sess && sess.perfil === 'cliente') ? sess.id : idDev;
    if (!idCliente) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ erro: 'Nao autenticado.' }));
    }
    despachar(req, res, m, url, idCliente);
  });

  return true;
}

function despachar(req, res, m, url, idCliente) {
  if (m === 'GET'  && url === '/api/gamificacao/status')   return getStatus(req, res, idCliente);
  if (m === 'POST' && url === '/api/gamificacao/checkin')  return postCheckin(req, res, idCliente);
  if (m === 'POST' && url === '/api/gamificacao/alimentar')return postAlimentar(req, res, idCliente);
  if (m === 'GET'  && url === '/api/gamificacao/loja')     return getLoja(req, res, idCliente);
  if (m === 'GET'  && url === '/api/gamificacao/ranking')  return getRanking(req, res);

  let mm = url.match(/^\/api\/gamificacao\/tarefa\/(\d+)$/);
  if (m === 'POST' && mm) return postTarefa(req, res, idCliente, +mm[1]);

  mm = url.match(/^\/api\/gamificacao\/comprar\/(\d+)$/);
  if (m === 'POST' && mm) return postComprar(req, res, idCliente, +mm[1]);

  mm = url.match(/^\/api\/gamificacao\/equipar\/(\d+)$/);
  if (m === 'POST' && mm) return postEquipar(req, res, idCliente, +mm[1]);

  res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ erro: 'Rota nao encontrada.' }));
}

module.exports = { handle };