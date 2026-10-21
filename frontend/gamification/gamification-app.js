/* DaFix Pets · UI do hub v2 (5 slots + onboarding) */
'use strict';
(function () {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const G = window.Gamif;

  const store = {
    tab: 'pet', storeSlot: 'all',
    rankingAud: 'funcionario', rankingPeriod: 'weekly',
    previewSkin: null, previewHat: null, previewCollar: null,
    previewClothes: null, previewBackground: null,
  };

  // ===== Utils =====
  function initTheme() {
    const saved = localStorage.getItem('dafix_theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
    $('#themeToggle')?.addEventListener('click', () => {
      const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('dafix_theme', next);
    });
  }

  function toast(title, msg = '', type = 'success') {
    const wrap = $('#gToasts');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = `g-toast g-toast--${type}`;
    el.innerHTML = `<span>${type === 'levelup' ? '🎉' : '✅'}</span><span><strong>${title}</strong>${msg ? ' · ' + msg : ''}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('is-out'); setTimeout(() => el.remove(), 320); }, 3400);
  }

  function initTabs() {
    $$('.g-tab').forEach(t => t.addEventListener('click', () => goTab(t.dataset.tab)));
    $$('[data-goto]').forEach(b => b.addEventListener('click', () => goTab(b.dataset.goto)));
  }
  function goTab(tab) {
    store.tab = tab;
    $$('.g-tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === tab));
    $$('.g-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === tab));
    if (tab === 'store') renderStore();
    if (tab === 'ranking') renderRanking();
    if (tab === 'goals') renderGoals();
    if (tab === 'pet') renderPet();
  }

  function audience() {
    try { return JSON.parse(localStorage.getItem('dafix_session') || '{}').perfil === 'funcionario' ? 'funcionario' : 'cliente'; }
    catch { return 'cliente'; }
  }

  // ===== Pet Sprite Renderer (5 slots) =====
  function paintSprite(spriteEl, opts) {
    if (!spriteEl) return;
    const { skin, hat, collar, clothes, background } = opts;
    spriteEl.style.setProperty('--pet-color', skin.color || '#2563eb');
    spriteEl.querySelector('.g-pet-sprite__emoji').textContent = skin.emoji || '🐕';
    const hatEl = spriteEl.querySelector('.g-pet-sprite__hat');
    if (hat) { hatEl.textContent = hat.emoji; hatEl.hidden = false; } else hatEl.hidden = true;
    const colEl = spriteEl.querySelector('.g-pet-sprite__collar');
    if (collar) { colEl.textContent = collar.emoji; colEl.hidden = false; } else colEl.hidden = true;
    const clEl = spriteEl.querySelector('.g-pet-sprite__clothes');
    if (clEl) {
      if (clothes) { clEl.textContent = clothes.emoji; clEl.hidden = false; } else clEl.hidden = true;
    }
  }

  function paintBackground(stageEl, bgEl, background) {
    if (!bgEl) return;
    if (background && background.color) {
      bgEl.hidden = false;
      bgEl.style.background = `linear-gradient(135deg, ${background.color}40, ${background.color}10)`;
      bgEl.textContent = background.emoji || '';
      bgEl.classList.add('g-pet-stage__bg-custom--show');
    } else {
      bgEl.hidden = true;
      bgEl.classList.remove('g-pet-stage__bg-custom--show');
    }
    if (stageEl) stageEl.classList.toggle('has-custom-bg', !!background);
  }

  // ===== Pet Panel =====
  function renderPet() {
    const pet = G.getPet();
    const food = G.getFood();
    const skin = G.COSMETICS.find(c => c.slug === pet.skin) || G.COSMETICS[0];
    const hat = G.COSMETICS.find(c => c.slug === pet.equipped.hat);
    const collar = G.COSMETICS.find(c => c.slug === pet.equipped.collar);
    const clothes = G.COSMETICS.find(c => c.slug === pet.equipped.clothes);
    const background = G.COSMETICS.find(c => c.slug === pet.equipped.background);

    paintSprite($('#petSprite'), { skin, hat, collar, clothes });
    paintBackground($('#petStage'), $('#petStageBg'), background);

    $('#petName').textContent = pet.name;
    $('#petLevelBadge').textContent = `Lv. ${pet.level}`;
    $('#petXpLabel').textContent = `${pet.xpInLevel} / ${pet.xpToNext} XP para o próximo nível`;
    $('#petXpBar').style.width = Math.min(100, (pet.xpInLevel / pet.xpToNext) * 100) + '%';

    const mood = pet.hunger >= 80 ? '😊 Feliz' : pet.hunger >= 50 ? '😐 Neutro' : pet.hunger >= 20 ? '😟 Com fome' : '😴 Hibernando';
    $('#petMood').textContent = mood;

    $('#statFood').textContent = food;
    $('#statStreak').textContent = G.getStreak().current;
    $('#statBadges').textContent = G.getBadges().length;
    $('#statRank').textContent = '#' + G.getLeaderboard(audience(), 'weekly').me.rank;

    $('#hungerLabel').textContent = pet.hunger + '%';
    $('#hungerBar').style.width = pet.hunger + '%';

    const feedBtn = $('#feedBtn');
    feedBtn.disabled = food < 1;
    feedBtn.textContent = food < 1 ? '🍖 Sem comida' : '🍖 Alimentar (+15 XP)';

    const badges = G.getBadges();
    const badgesList = $('#badgesList');
    if (!badges.length) badgesList.innerHTML = '<p class="g-muted g-muted--sm">Nenhuma insígnia ainda. Continue evoluindo!</p>';
    else badgesList.innerHTML = badges.map(slug => {
      const b = G.BADGE_DEFS[slug];
      if (!b) return '';
      return `<span class="g-badge-chip g-badge-chip--${b.rarity}"><span class="g-badge-chip__emoji">${b.emoji}</span>${b.name}</span>`;
    }).join('');

    renderGoalsPreview();
  }

  function renderGoalsPreview() {
    const st = G.getGoalsState();
    const defs = G.GOAL_DEFS[audience()];
    const wrap = $('#petGoalsPreview');
    wrap.innerHTML = defs.map(g => {
      const cur = st.progress[g.slug] || 0;
      const done = st.completed.includes(g.slug);
      return `
        <div class="g-goal-card ${done ? 'is-completed' : ''}">
          <div class="g-goal-card__head"><span class="g-goal-card__icon">${g.icon}</span><span class="g-goal-card__title">${g.title}</span></div>
          <div class="g-goal-card__progress"><span>Progresso</span><strong>${cur}/${g.target}</strong></div>
          <div class="g-bar" style="height:6px"><div class="g-bar__fill" style="width:${(cur/g.target)*100}%"></div></div>
          <div class="g-goal-card__rewards"><span class="food">+${g.food} 🍖</span><span class="xp">+${g.xp} XP</span></div>
        </div>`;
    }).join('');
  }

  function renderGoals() {
    const st = G.getGoalsState();
    const defs = G.GOAL_DEFS[audience()];
    const wrap = $('#goalsFull');
    wrap.innerHTML = defs.map(g => {
      const cur = st.progress[g.slug] || 0;
      const done = st.completed.includes(g.slug);
      return `
        <div class="g-goal-card ${done ? 'is-completed' : ''}">
          <div class="g-goal-card__head">
            <span class="g-goal-card__icon">${g.icon}</span>
            <div><div class="g-goal-card__title">${g.title}</div><div class="g-goal-card__desc">${g.desc}</div></div>
          </div>
          <div class="g-goal-card__progress"><span>Progresso</span><strong>${cur}/${g.target}</strong></div>
          <div class="g-bar" style="height:6px"><div class="g-bar__fill" style="width:${(cur/g.target)*100}%"></div></div>
          <div class="g-goal-card__rewards"><span class="food">+${g.food} 🍖</span><span class="xp">+${g.xp} XP</span></div>
        </div>`;
    }).join('');

    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const diff = tomorrow - now;
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    $('#goalsReset').textContent = `Renova em ${h}h ${m}min`;

    renderHeatmap();
    renderDemoActions();
  }

  function renderHeatmap() {
    const wrap = $('#heatmap');
    const cells = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const isToday = i === 0;
      const seed = d.getDate() + d.getMonth() * 31;
      const cls = seed % 3 === 0 ? 'is-partial' : (seed % 2 === 0 ? 'is-full' : '');
      cells.push(`<div class="g-heatmap__cell ${cls} ${isToday ? 'is-today' : ''}" title="${d.toLocaleDateString('pt-BR')}"></div>`);
    }
    wrap.innerHTML = cells.join('');
  }

  function renderDemoActions() {
    const wrap = $('#demoActions');
    const aud = audience();
    const events = aud === 'cliente'
      ? [
          { evt: 'service_requested', goal: 'goal_client_order',  label: '🛠️ Solicitar serviço' },
          { evt: 'review_submitted',  goal: 'goal_client_review', label: '⭐ Avaliar serviço' },
          { evt: 'referral_converted', label: '🎁 Indicação' },
        ]
      : [
          { evt: 'service_completed', goal: 'goal_emp_complete', label: '✅ Concluir serviço' },
          { evt: 'review_5star_recv',  goal: 'goal_emp_complete', label: '⭐ Receber 5 estrelas' },
          { evt: 'referral_converted', label: '🎁 Indicação' },
        ];
    wrap.innerHTML = events.map(e => `<button class="g-btn g-btn--ghost g-btn--sm" data-evt="${e.evt}" ${e.goal ? `data-goal="${e.goal}"` : ''}>${e.label}</button>`).join('');

    wrap.querySelectorAll('[data-evt]').forEach(b => {
      b.addEventListener('click', () => {
        const r = G.applyEvent(b.dataset.evt, { via: 'demo' });
        if (b.dataset.goal) {
          const res = G.progressGoal(b.dataset.goal, 1);
          if (res?.justCompleted) toast(`Meta concluída!`, `+${res.def.food} 🍖 +${res.def.xp} XP`);
        }
        if (r?.levelUp) toast('Subiu de nível!', `Agora Lv. ${r.newLevel}`, 'levelup');
        else if (r) toast(r.label, `+${r.xp} XP`);
        renderPet();
        renderGoals();
      });
    });
  }

  // ===== Store =====
  function initStore() {
    $$('#storeTabs .g-chip').forEach(c => c.addEventListener('click', () => {
      store.storeSlot = c.dataset.slot;
      $$('#storeTabs .g-chip').forEach(x => x.classList.toggle('is-active', x === c));
      renderStore();
    }));
    $('#saveCosmetics')?.addEventListener('click', saveCosmetics);
  }

  function renderStore() {
    const pet = G.getPet();
    const items = G.getStoreItems();
    const filtered = store.storeSlot === 'all' ? items : items.filter(i => i.slot === store.storeSlot);
    const grid = $('#storeGrid');
    grid.innerHTML = filtered.map(item => {
      const locked = pet.level < item.unlock;
      const isSkin = item.slot === 'skin';
      const equipped = isSkin ? pet.skin === item.slug : pet.equipped[item.slot] === item.slug;
      return `
        <div class="g-store-item ${locked ? 'is-locked' : ''} ${equipped ? 'is-equipped' : ''}" data-slug="${item.slug}" data-slot="${item.slot}">
          ${locked ? `<span class="g-store-item__lock">🔒 Nv. ${item.unlock}</span>` : ''}
          <span class="g-store-item__emoji">${item.emoji}</span>
          <span class="g-store-item__name">${item.name}</span>
          <span class="g-store-item__rarity rarity-${item.rarity}">${item.rarity}</span>
          ${locked
            ? `<button class="g-btn g-btn--ghost g-btn--sm" disabled>Bloqueado</button>`
            : equipped
              ? `<button class="g-btn g-btn--ghost g-btn--sm" data-act="unequip">Remover</button>`
              : `<button class="g-btn g-btn--primary g-btn--sm" data-act="equip">Equipar</button>`}
        </div>`;
    }).join('');

    grid.querySelectorAll('.g-store-item').forEach(el => {
      el.addEventListener('click', (e) => {
        const slug = el.dataset.slug;
        const item = G.COSMETICS.find(c => c.slug === slug);
        if (!item || G.getPet().level < item.unlock) return;
        if (e.target.matches('[data-act]')) return;
        previewItem(item);
      });
    });

    grid.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const card = btn.closest('.g-store-item');
        const slug = card.dataset.slug;
        const item = G.COSMETICS.find(c => c.slug === slug);
        if (btn.dataset.act === 'equip') { G.equipCosmetic(slug); toast(`${item.name} equipado!`); }
        else { G.unequipSlot(item.slot); toast(`${item.name} removido.`); }
        renderStore();
        renderPet();
      });
    });

    updatePreviewFromPet();
  }

  function previewItem(item) {
    if (item.slot === 'skin') store.previewSkin = item.slug;
    else store['preview' + item.slot.charAt(0).toUpperCase() + item.slot.slice(1)] = item.slug;
    updatePreview();
  }

  function updatePreviewFromPet() {
    const pet = G.getPet();
    store.previewSkin = pet.skin;
    store.previewHat = pet.equipped.hat;
    store.previewCollar = pet.equipped.collar;
    store.previewClothes = pet.equipped.clothes;
    store.previewBackground = pet.equipped.background;
    updatePreview();
  }

  function updatePreview() {
    const el = $('#storePreview');
    if (!el) return;
    const skin = G.COSMETICS.find(c => c.slug === store.previewSkin) || G.COSMETICS[0];
    const hat = G.COSMETICS.find(c => c.slug === store.previewHat);
    const collar = G.COSMETICS.find(c => c.slug === store.previewCollar);
    const clothes = G.COSMETICS.find(c => c.slug === store.previewClothes);
    const background = G.COSMETICS.find(c => c.slug === store.previewBackground);

    paintSprite(el, { skin, hat, collar, clothes });
    paintBackground($('#storePreviewStage'), $('#storePreviewBg'), background);
  }

  function saveCosmetics() {
    if (store.previewSkin) G.savePet({ skin: store.previewSkin });
    const pet = G.getPet();
    pet.equipped = {
      hat: store.previewHat,
      collar: store.previewCollar,
      clothes: store.previewClothes,
      background: store.previewBackground,
    };
    G.savePet({ equipped: pet.equipped });
    toast('Customização salva!');
    renderStore();
    renderPet();
  }

  // ===== Ranking =====
  function initRanking() {
    $$('[data-aud]').forEach(b => b.addEventListener('click', () => {
      store.rankingAud = b.dataset.aud;
      $$('[data-aud]').forEach(x => x.classList.toggle('is-active', x === b));
      renderRanking();
    }));
    $$('[data-period]').forEach(b => b.addEventListener('click', () => {
      store.rankingPeriod = b.dataset.period;
      $$('[data-period]').forEach(x => x.classList.toggle('is-active', x === b));
      renderRanking();
    }));
  }

  function renderRanking() {
    const { top, me, total } = G.getLeaderboard(store.rankingAud, store.rankingPeriod);
    const podium = $('#podium');
    const list = $('#rankList');
    const myRank = $('#myRank');

    const top3 = top.slice(0, 3);
    const order = [1, 0, 2];
    podium.innerHTML = order.map(i => {
      const e = top3[i];
      if (!e) return '<div></div>';
      return `
        <div class="g-podium__item g-podium__item--${e.rank}">
          <div class="g-podium__avatar" style="background:${e.color}">${e.rank === 1 ? '👑' : ''}${e.initials}</div>
          <div class="g-podium__name">${e.name}${e.isMe ? ' (você)' : ''}</div>
          <div class="g-podium__score">${e.score} pts</div>
          <div class="g-podium__rank">${e.rank === 1 ? '🥇' : e.rank === 2 ? '🥈' : '🥉'}</div>
        </div>`;
    }).join('');

    list.innerHTML = top.slice(3).map(e => `
      <li class="g-rank-item ${e.isMe ? 'is-me' : ''}">
        <span class="g-rank-item__pos">#${e.rank}</span>
        <span class="g-rank-item__avatar" style="background:${e.color}">${e.initials}</span>
        <span class="g-rank-item__name">${e.name}${e.isMe ? ' (você)' : ''}</span>
        <span class="g-rank-item__level">Lv. ${e.level}</span>
        <span class="g-rank-item__score">${e.score}</span>
      </li>`).join('');

    myRank.innerHTML = `
      <div><div class="g-muted">Sua posição</div><strong>#${me.rank} de ${total}</strong></div>
      <div style="text-align:right"><div class="g-muted">Score</div><strong>${me.score} pts</strong></div>`;
  }

  // ===== Onboarding =====
  function checkOnboarding() {
    const ob = G.getOnboarding();
    if (ob.done) return;
    const modal = $('#onboardingModal');
    if (!modal) return;
    modal.hidden = false;
    // Atualiza sprite do onboarding
    const pet = G.getPet();
    const skin = G.COSMETICS.find(c => c.slug === pet.skin) || G.COSMETICS[0];
    paintSprite($('#obSprite'), { skin, hat: null, collar: null, clothes: null });
    updateOnboardingProgress();
  }

  function updateOnboardingProgress() {
    const pet = G.getPet();
    const bar = $('#obXpBar');
    const label = $('#obXpLabel');
    if (bar) bar.style.width = Math.min(100, (pet.xpInLevel / pet.xpToNext) * 100) + '%';
    if (label) label.textContent = `${pet.xpInLevel} / ${pet.xpToNext} XP · Lv. ${pet.level}`;
  }

  async function runOnboardingFeed() {
    const btn = $('#onboardingFeed');
    if (btn) { btn.disabled = true; btn.textContent = 'Alimentando...'; }
    let foods = G.getFood();
    let fed = 0;
    while (G.getFood() > 0 && fed < 10 && G.getPet().level < 2) {
      G.applyEvent('feed_pet');
      fed++;
      renderPet();
      updateOnboardingProgress();
      await new Promise(r => setTimeout(r, 180));
    }
    G.markOnboardingDone();
    const modal = $('#onboardingModal');
    if (modal) modal.hidden = true;
    toast('🎉 Bem-vindo!', `Faísca evoluiu para Lv. ${G.getPet().level}!`, 'levelup');
    renderPet();
  }

  function skipOnboarding() {
    G.markOnboardingDone();
    const modal = $('#onboardingModal');
    if (modal) modal.hidden = true;
    toast('Tudo bem!', 'Você pode alimentar quando quiser.', 'info');
  }

  function initOnboarding() {
    $('#onboardingFeed')?.addEventListener('click', runOnboardingFeed);
    $('#onboardingSkip')?.addEventListener('click', skipOnboarding);
  }

  // ===== Rename / Feed =====
  function initRename() {
    $('#renameBtn')?.addEventListener('click', () => {
      const pet = G.getPet();
      const name = prompt('Novo nome do pet (máx. 20 caracteres):', pet.name);
      if (!name || !name.trim()) return;
      G.savePet({ name: name.trim().slice(0, 20) });
      renderPet();
      toast('Nome atualizado!');
    });
  }

  function initFeed() {
    $('#feedBtn')?.addEventListener('click', () => {
      if (G.getFood() < 1) { toast('Sem comida!', 'Complete metas para ganhar.', 'error'); return; }
      const r = G.applyEvent('feed_pet', { via: 'ui' });
      if (r) {
        if (r.levelUp) toast('Subiu de nível!', `Agora Lv. ${r.newLevel}`, 'levelup');
        else toast(`+${r.xp} XP`);
        renderPet();
      }
    });
  }

  function bindEvents() {
    G.on('event', () => renderPet());
    G.on('levelup', () => renderPet());
  }

  function init() {
    initTheme();
    initTabs();
    initStore();
    initRanking();
    initRename();
    initFeed();
    initOnboarding();
    bindEvents();
    renderPet();
    renderGoals();
    renderStore();
    renderRanking();
    checkOnboarding();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();