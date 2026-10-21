/* DaFix Pets · Widget flutuante (injetado nos dashboards) */
(function () {
    if (window.__gamifWidgetLoaded) return;
    window.__gamifWidgetLoaded = true;
  
    const HUB = '/gamification/index.html';
  
    // Fallback de toast (caso _showToast não exista)
    window._gamifToast = window._gamifToast || function (title, msg) {
      const t = document.createElement('div');
      t.style.cssText = 'position:fixed;bottom:90px;right:22px;z-index:900;padding:12px 18px;background:#10b981;color:#fff;border-radius:12px;font-family:"Plus Jakarta Sans",sans-serif;font-size:13px;font-weight:600;box-shadow:0 12px 32px -8px rgba(0,0,0,.25);opacity:0;transform:translateY(8px);transition:all .3s;max-width:320px;';
      t.textContent = `${title}${msg ? ' · ' + msg : ''}`;
      document.body.appendChild(t);
      requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateY(0)'; });
      setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateY(8px)'; setTimeout(() => t.remove(), 320); }, 3000);
    };
  
    function boot() {
      if (!window.Gamif) { setTimeout(boot, 100); return; }
      injectCSS();
      injectLevelBadge();
      injectWidget();
      bindEvents();
      setInterval(refresh, 60000);
    }
  
    function injectCSS() {
      if (document.querySelector('link[data-gamif]')) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/gamification/gamification-widget.css';
      link.setAttribute('data-gamif', '1');
      document.head.appendChild(link);
    }
  
    function injectLevelBadge() {
      if (document.querySelector('.gamif-level-badge')) return;
      const targets = ['.user-menu__name', '.h-name', '#sidebar-username', '.sidebar__profile-name', '.brand__text .brand__title'];
      const target = targets.map(s => document.querySelector(s)).find(Boolean);
      if (!target) return;
      const pet = Gamif.getPet();
      const badge = document.createElement('span');
      badge.className = 'gamif-level-badge';
      badge.textContent = `Lv.${pet.level}`;
      badge.title = `Nível ${pet.level} · ${pet.xpInLevel}/${pet.xpToNext} XP`;
      target.after(badge);
    }
  
    function injectWidget() {
      if (document.getElementById('gamif-widget')) return;
      const pet = Gamif.getPet();
      const food = Gamif.getFood();
      const goals = Gamif.getGoalsState();
      const totalGoals = Gamif.GOAL_DEFS[getAudience()].length;
      const doneGoals = goals.completed.length;
      const skin = Gamif.COSMETICS.find(c => c.slug === pet.skin) || Gamif.COSMETICS[0];
      const hat = Gamif.COSMETICS.find(c => c.slug === pet.equipped.hat);
  
      const el = document.createElement('a');
      el.id = 'gamif-widget';
      el.href = HUB;
      el.className = 'gamif-widget';
      el.setAttribute('aria-label', `Abrir painel do pet — Nível ${pet.level}`);
      el.innerHTML = `
        <div class="gamif-widget__sprite" style="--pet-color:${skin.color}">
          <span class="gamif-widget__emoji">${skin.emoji}</span>
          ${hat ? `<span class="gamif-widget__hat">${hat.emoji}</span>` : ''}
          <span class="gamif-widget__level">Lv.${pet.level}</span>
        </div>
        <div class="gamif-widget__info">
          <div class="gamif-widget__name">${escape(pet.name)}</div>
          <div class="gamif-widget__hunger"><div class="gamif-widget__hunger-bar" style="width:${pet.hunger}%"></div></div>
          <div class="gamif-widget__meta">
            <span>🍖 ${food}</span>
            <span>🎯 ${doneGoals}/${totalGoals}</span>
          </div>
        </div>
        ${doneGoals < totalGoals ? '<span class="gamif-widget__alert" aria-hidden="true"></span>' : ''}
      `;
      document.body.appendChild(el);
    }
  
    function bindEvents() {
      Gamif.on('event', () => refresh());
      Gamif.on('levelup', () => {
        const w = document.getElementById('gamif-widget');
        if (!w) return;
        w.classList.add('gamif-widget--levelup');
        setTimeout(() => w.classList.remove('gamif-widget--levelup'), 1500);
      });
    }
  
    function refresh() {
      const w = document.getElementById('gamif-widget');
      if (!w) { injectWidget(); return; }
      const pet = Gamif.getPet();
      const food = Gamif.getFood();
      const goals = Gamif.getGoalsState();
      const totalGoals = Gamif.GOAL_DEFS[getAudience()].length;
      const doneGoals = goals.completed.length;
      const skin = Gamif.COSMETICS.find(c => c.slug === pet.skin) || Gamif.COSMETICS[0];
      const hat = Gamif.COSMETICS.find(c => c.slug === pet.equipped.hat);
  
      w.querySelector('.gamif-widget__emoji').textContent = skin.emoji;
      w.querySelector('.gamif-widget__sprite').style.setProperty('--pet-color', skin.color);
      w.querySelector('.gamif-widget__level').textContent = `Lv.${pet.level}`;
      w.querySelector('.gamif-widget__name').textContent = pet.name;
      w.querySelector('.gamif-widget__hunger-bar').style.width = pet.hunger + '%';
      w.querySelector('.gamif-widget__meta').innerHTML = `<span>🍖 ${food}</span><span>🎯 ${doneGoals}/${totalGoals}</span>`;
  
      const hatEl = w.querySelector('.gamif-widget__hat');
      if (hat && !hatEl) {
        const h = document.createElement('span');
        h.className = 'gamif-widget__hat';
        h.textContent = hat.emoji;
        w.querySelector('.gamif-widget__sprite').appendChild(h);
      } else if (hatEl) {
        if (hat) hatEl.textContent = hat.emoji;
        else hatEl.remove();
      }
    }
  
    function getAudience() {
      try { return JSON.parse(localStorage.getItem('dafix_session') || '{}').perfil === 'funcionario' ? 'funcionario' : 'cliente'; }
      catch { return 'cliente'; }
    }
    function escape(s) { return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }
  
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
  })();