/* Pet Widget — Dafix · Streak + Virtual Pet */
(() => {
  'use strict';

  const API = '';                    // mesmo host
  const CLIENTE_KEY = 'dafix_cliente_id';

  // ⚠️ Substitua por: sessão real, cookie httpOnly ou login endpoint.
  // Aqui pegamos do localStorage para simplificar a integração.
  // Antes: const idCliente = Number(localStorage.getItem(CLIENTE_KEY) || 0);
  // Agora: usa cookie via /api/auth/me
  let USER = null;
  (async function bootstrap() {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (!res.ok) return;                  // não logado → widget não aparece
      const data = await res.json();
      if (data.perfil !== 'cliente') return;
      USER = data.usuario;
      iniciarWidget();
    } catch { /* ignora */ }
  })();

  function iniciarWidget() {
    // ... todo o código anterior que dependia de idCliente
    // ele já estará protegido por session cookie no backend
  }
  if (!idCliente) return;            // sem login → widget não aparece

  const EMOJIS = ['🐣', '🐥', '🐤', '🦊', '🐯', '🐼', '🐨', '🦁'];
  const petEmoji = (nivel) => EMOJIS[Math.min(EMOJIS.length - 1, Math.floor((nivel - 1) / 3))];

  // ---------- Estado ----------
  const state = {
    perfil: null, itens: [], bonus: {}, premium: false,
    tarefas: [], loja: [], ranking: [],
    aba: 'status'     // status | loja | ranking
  };

  // ---------- HTTP helper ----------
  async function api(path, opts = {}) {
    const res = await fetch(path, {
      ...opts,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) }
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).erro || res.statusText);
    return res.json();
  }

  // ---------- Render ----------
  function render() {
    const p = state.perfil;
    if (!p) return;

    const xpNecessario = 100 + (p.pet_nivel - 1) * 50;
    const xpPct = Math.min(100, (p.pet_xp / xpNecessario) * 100);
    const fomePct = p.pet_fome;
    const felPct = p.pet_felicidade;

    const emojiEquip = state.itens.map(i => i.emoji).join(' ') || '';

    let conteudo = '';

    if (state.aba === 'status') {
      conteudo = `
        <div class="petw-bars">
          <div class="petw-bar-row"><span class="petw-bar-lbl">🍖 Fome</span>
            <div class="petw-bar"><span class="fome" style="width:${fomePct}%"></span></div>
            <strong style="width:34px;text-align:right">${fomePct}%</strong></div>
          <div class="petw-bar-row"><span class="petw-bar-lbl">💖 Felicidade</span>
            <div class="petw-bar"><span class="fel" style="width:${felPct}%"></span></div>
            <strong style="width:34px;text-align:right">${felPct}%</strong></div>
          <div class="petw-bar-row"><span class="petw-bar-lbl">✨ XP</span>
            <div class="petw-bar"><span class="xp" style="width:${xpPct}%"></span></div>
            <strong style="width:52px;text-align:right;font-size:11px">${p.pet_xp}/${xpNecessario}</strong></div>
        </div>
        <div class="petw-coins">🪙 ${p.moedas} moedas</div>

        <div class="petw-section-title">Alimentar</div>
        <div class="petw-alimentar">
          <button data-comida="basica">🍎 Básica · 10🪙 · +10xp</button>
          <button data-comida="rara">🍰 Rara · 25🪙 · +30xp</button>
        </div>

        <div class="petw-section-title">Tarefas de hoje</div>
        <div class="petw-tarefas">
          ${state.tarefas.map(t => `
            <div class="petw-tarefa ${t.disponivel ? '' : 'off'}">
              <div>
                <strong>${t.titulo}</strong>
                <small>${t.tipo === 'premium' ? '⭐ Premium · ' : ''}+${t.recompensa_xp}xp · +${t.recompensa_moedas}🪙</small>
              </div>
              <button class="petw-btn-mini" data-tarefa="${t.id}" ${t.disponivel ? '' : 'disabled'}>
                ${t.disponivel ? 'Concluir' : 'Em CD'}
              </button>
            </div>
          `).join('') || '<p style="font-size:12px;color:var(--text-muted)">Sem tarefas disponíveis.</p>'}
        </div>
      `;
    } else if (state.aba === 'loja') {
      conteudo = state.loja.map(i => {
        let acao = '';
        if (i.bloqueado_premium) acao = `<span style="font-size:11px;color:#b45309;font-weight:700">⭐ Premium</span>`;
        else if (i.possui) acao = `<button class="petw-btn-mini" data-equipar="${i.id}" style="background:#10b981">Equipar</button>`;
        else acao = `<button class="petw-btn-mini" data-comprar="${i.id}">${i.preco_moedas}🪙</button>`;
        return `
          <div class="petw-item">
            <div class="petw-item-emoji">${i.emoji}</div>
            <div class="petw-item-info">
              <div class="petw-item-name">${i.nome}</div>
              <div class="petw-item-desc">${i.descricao || ''}</div>
            </div>
            ${acao}
          </div>
        `;
      }).join('') || '<p style="font-size:12px">Loja vazia.</p>';
    } else if (state.aba === 'ranking') {
      conteudo = state.ranking.map((r, i) => `
        <div class="petw-rank">
          <div class="petw-rank-pos ${i < 3 ? 'p' + (i + 1) : ''}">${r.posicao}</div>
          <div style="flex:1;min-width:0">
            <strong style="display:block;font-size:12.5px">${r.cliente}</strong>
            <small style="color:var(--text-muted)">${r.pet_nome}</small>
          </div>
          <div style="text-align:right;font-size:11.5px">
            <strong>Lv ${r.pet_nivel}</strong><br>
            <span style="color:#f97316">🔥 ${r.streak}</span>
          </div>
        </div>
      `).join('') || '<p style="font-size:12px">Sem dados.</p>';
    }

    panel.innerHTML = `
      <div class="petw-hd">
        <div class="petw-avatar">
          ${petEmoji(p.pet_nivel)}
          <span class="petw-lvl">Lv ${p.pet_nivel}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div class="petw-name">${p.pet_nome} ${emojiEquip}</div>
          <div class="petw-sub">
            🔥 ${p.streak_atual} dias seguidos
            ${p.streak_recorde > p.streak_atual ? ` · recorde ${p.streak_recorde}` : ''}
          </div>
        </div>
      </div>

      <div class="petw-tabrow">
        <button class="petw-tab ${state.aba === 'status' ? 'active' : ''}" data-aba="status">Status</button>
        <button class="petw-tab ${state.aba === 'loja' ? 'active' : ''}" data-aba="loja">Loja</button>
        <button class="petw-tab ${state.aba === 'ranking' ? 'active' : ''}" data-aba="ranking">Ranking</button>
      </div>

      <div>${conteudo}</div>
    `;
  }

  // ---------- Bootstrap DOM ----------
  const root = document.createElement('div');
  root.className = 'petw-root';
  root.innerHTML = `
    <div class="petw-panel" id="petw-panel"></div>
    <button class="petw-btn" aria-label="Abrir pet">
      🐣 <span class="petw-streak" id="petw-streak" hidden>🔥 0</span>
    </button>
  `;
  document.body.appendChild(root);

  const btn = root.querySelector('.petw-btn');
  const panel = root.querySelector('#petw-panel');
  const streakBadge = root.querySelector('#petw-streak');

  // ---------- Fluxos ----------
  async function carregarStatus() {
    const data = await api('/api/gamificacao/status');
    state.perfil = data.perfil;
    state.itens = data.itens;
    state.bonus = data.bonus;
    state.premium = data.premium;
    state.tarefas = data.tarefas;

    const stk = data.perfil.streak_atual;
    if (stk > 0) {
      streakBadge.hidden = false;
      streakBadge.textContent = `🔥 ${stk}`;
    } else {
      streakBadge.hidden = true;
    }

    // Check-in silencioso (mantém streak vivo)
    try {
      const ck = await api('/api/gamificacao/checkin', { method: 'POST' });
      if (ck.streak !== stk) {
        state.perfil.streak_atual = ck.streak;
        state.perfil.streak_recorde = ck.recorde;
        streakBadge.hidden = ck.streak === 0;
        streakBadge.textContent = `🔥 ${ck.streak}`;
      }
    } catch { /* ignora */ }

    render();
  }

  async function carregarLoja() {
    const data = await api('/api/gamificacao/loja');
    state.loja = data.itens;
    state.premium = data.premium;
    render();
  }

  async function carregarRanking() {
    const data = await api('/api/gamificacao/ranking');
    state.ranking = data.ranking;
    render();
  }

  // ---------- Eventos ----------
  btn.addEventListener('click', async () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open') && !state.perfil) {
      try { await carregarStatus(); } catch (e) { console.error(e); }
    }
  });

  panel.addEventListener('click', async (e) => {
    const tgt = e.target.closest('[data-aba],[data-comida],[data-tarefa],[data-comprar],[data-equipar]');
    if (!tgt) return;

    if (tgt.dataset.aba) {
      state.aba = tgt.dataset.aba;
      if (state.aba === 'loja' && !state.loja.length) await carregarLoja();
      if (state.aba === 'ranking' && !state.ranking.length) await carregarRanking();
      render();
      return;
    }

    if (tgt.dataset.comida) {
      tgt.disabled = true;
      try {
        await api('/api/gamificacao/alimentar', {
          method: 'POST',
          body: JSON.stringify({ comida: tgt.dataset.comida })
        });
        await carregarStatus();
      } catch (err) { alert(err.message); }
      return;
    }

    if (tgt.dataset.tarefa) {
      tgt.disabled = true;
      try {
        const r = await api(`/api/gamificacao/tarefa/${tgt.dataset.tarefa}`, { method: 'POST' });
        if (r.subiuNivel) alert(`🎉 Seu pet subiu para o nível ${r.pet.nivel}!`);
        await carregarStatus();
      } catch (err) { alert(err.message); tgt.disabled = false; }
      return;
    }

    if (tgt.dataset.comprar) {
      tgt.disabled = true;
      try {
        await api(`/api/gamificacao/comprar/${tgt.dataset.comprar}`, { method: 'POST' });
        await carregarLoja();
        await carregarStatus();
      } catch (err) { alert(err.message); tgt.disabled = false; }
      return;
    }

    if (tgt.dataset.equipar) {
      try {
        await api(`/api/gamificacao/equipar/${tgt.dataset.equipar}`, { method: 'POST' });
        await carregarLoja();
        await carregarStatus();
      } catch (err) { alert(err.message); }
      return;
    }
  });

  // Bootstrap: primeira carga em background
  carregarStatus().catch(console.error);
})();