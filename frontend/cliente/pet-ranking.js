/* Ranking Global — consome /api/gamificacao/ranking */
(() => {
  'use strict';

  const EMOJIS = ['🐣','🐥','🐤','🦊','🐯','🐼','🐨','🦁'];
  const petEmoji = (n) => EMOJIS[Math.min(EMOJIS.length - 1, Math.floor((n - 1) / 3))];

  const state = { ranking: [], scope: 'geral', busca: '' };

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  async function carregar() {
    try {
      const res = await fetch('/api/gamificacao/ranking', { credentials: 'include' });
      if (!res.ok) throw new Error('Falha ao carregar');
      const data = await res.json();
      state.ranking = data.ranking || [];
      render();
      $('#rk-meta').textContent = `${state.ranking.length} pets no ranking`;
    } catch (e) {
      $('#rk-meta').textContent = 'Erro ao carregar ranking';
      console.error(e);
    }
  }

  function filtrar(lista) {
    let out = [...lista];
    const q = state.busca.toLowerCase().trim();
    if (q) out = out.filter(r => (r.cliente || '').toLowerCase().includes(q));
    return out;
  }

  function render() {
    const lista = filtrar(state.ranking);
    const pódio = lista.slice(0, 3);
    const resto = lista.slice(3);

    // Pódio
    const pEl = $('#rk-podium');
    if (pódio.length === 0) { pEl.innerHTML = ''; }
    else {
      const ordem = pódio.length >= 2 ? [1, 0, 2] : pódio.map((_, i) => i);
      pEl.innerHTML = ordem.map(idx => {
        const r = pódio[idx];
        if (!r) return '';
        const pos = idx + 1;
        return `
          <div class="rk-pod rk-pod--${pos}">
            <div class="rk-pod-pos">${pos}</div>
            <div class="rk-pod-emoji">${petEmoji(r.pet_nivel)}</div>
            <div class="rk-pod-name">${escape(r.cliente)}</div>
            <div class="rk-pod-pet">${escape(r.pet_nome)}</div>
            <div class="rk-pod-stats">
              <span class="lvl">Lv ${r.pet_nivel}</span>
              <span class="stk">🔥 ${r.streak}</span>
            </div>
          </div>`;
      }).join('');
    }

    // Lista
    const listEl = $('#rk-list');
    listEl.innerHTML = resto.map(r => `
      <li class="rk-row">
        <span class="rk-row-pos">${r.posicao}</span>
        <div class="rk-row-info">
          <div class="rk-row-name">${escape(r.cliente)}</div>
          <div class="rk-row-pet">${petEmoji(r.pet_nivel)} ${escape(r.pet_nome)}</div>
        </div>
        <span class="rk-row-level">Lv ${r.pet_nivel}</span>
        <span class="rk-row-streak">🔥 ${r.streak}</span>
      </li>
    `).join('');

    $('#rk-empty').hidden = lista.length > 0;
  }

  function escape(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  }

  function toast(msg) {
    const wrap = $('#rk-toasts');
    const el = document.createElement('div');
    el.className = 'rk-toast';
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // Eventos
  $$('.rk-tab').forEach(t => t.addEventListener('click', () => {
    $$('.rk-tab').forEach(x => x.classList.remove('is-active'));
    t.classList.add('is-active');
    state.scope = t.dataset.scope;
    // "geral" usa o ranking completo; "mes"/"semana" seriam filtros adicionais (não implementados no backend — apenas feedback)
    if (state.scope !== 'geral') toast('Filtro de período em breve — exibindo ranking geral.');
    render();
  }));

  let debounce;
  $('#rk-search').addEventListener('input', (e) => {
    clearTimeout(debounce);
    debounce = setTimeout(() => { state.busca = e.target.value; render(); }, 150);
  });

  carregar();
})();