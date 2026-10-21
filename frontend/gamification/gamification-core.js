/* ============================================================
   DaFix Pets · gamification-core.js v2
   Núcleo: leveling, eventos, metas, inventário (5 slots), ranking.
   Persistência: localStorage (adapter trocável por fetch).
   ============================================================ */
   'use strict';

   const Gamif = (() => {
     const LS = {
       pet: 'dafix.gamif.pet', food: 'dafix.gamif.food', inv: 'dafix.gamif.inventory',
       goals: 'dafix.gamif.goals', streak: 'dafix.gamif.streak',
       badges: 'dafix.gamif.badges', events: 'dafix.gamif.events',
       onboarding: 'dafix.gamif.onboarding',
       session: 'dafix_session',
     };
   
     const xpForLevel    = (n) => Math.round(100 * Math.pow(n, 1.6) + 50 * n);
     const totalXpForLvl = (n) => { let a = 0; for (let i = 1; i < n; i++) a += xpForLevel(i); return a; };
     const levelFromXp   = (xp) => { let l = 1, a = 0; while (a + xpForLevel(l) <= xp) { a += xpForLevel(l); l++; } return l; };
     const xpProgress    = (xp) => { const l = levelFromXp(xp); return { level: l, xpInLevel: xp - totalXpForLvl(l), xpToNext: xpForLevel(l) }; };
   
     const REWARDS = {
       service_requested:  { food: 15, xp: 25,  label: 'Novo serviço solicitado!' },
       service_completed:  { food: 20, xp: 40,  label: 'Serviço concluído!' },
       review_submitted:   { food:  5, xp: 10,  label: 'Avaliação enviada!' },
       review_5star_recv:  { food: 10, xp: 20,  label: 'Avaliação 5★ recebida!' },
       daily_login:        { food:  3, xp:  5,  label: 'Bônus de login diário' },
       referral_converted: { food: 50, xp: 100, label: 'Indicação convertida!' },
       feed_pet:           { food: -1, xp: 15,  label: null },
       onboarding_bonus:   { food: 10, xp: 0,   label: 'Kit de boas-vindas recebido!' },
     };
   
     const COSMETICS = [
       // ===== skins =====
       { slug:'default_blue', name:'Azul Padrão',       slot:'skin',       rarity:'common',    unlock:1,  emoji:'🐕', color:'#2563eb' },
       { slug:'skin_green',   name:'Verde Faísca',      slot:'skin',       rarity:'uncommon',  unlock:3,  emoji:'🐕', color:'#10b981' },
       { slug:'skin_violet',  name:'Roxo Turbo',        slot:'skin',       rarity:'rare',      unlock:7,  emoji:'🐕', color:'#8b5cf6' },
       { slug:'skin_orange',  name:'Laranja Chama',     slot:'skin',       rarity:'rare',      unlock:10, emoji:'🐕', color:'#f97316' },
       { slug:'skin_gold',    name:'Dourado Lendário',  slot:'skin',       rarity:'legendary', unlock:25, emoji:'🐕', color:'#f59e0b' },
       // ===== hats =====
       { slug:'hat_cap',      name:'Boné Pro',          slot:'hat',        rarity:'common',    unlock:2,  emoji:'🧢' },
       { slug:'hat_top',      name:'Cartola',           slot:'hat',        rarity:'uncommon',  unlock:5,  emoji:'🎩' },
       { slug:'hat_crown',    name:'Coroa Real',        slot:'hat',        rarity:'legendary', unlock:30, emoji:'👑' },
       // ===== collars =====
       { slug:'collar_red',   name:'Coleira Vermelha',  slot:'collar',     rarity:'common',    unlock:1,  emoji:'🔴' },
       { slug:'collar_bow',   name:'Laço Azul',         slot:'collar',     rarity:'uncommon',  unlock:4,  emoji:'🎀' },
       { slug:'collar_bell',  name:'Sino Dourado',      slot:'collar',     rarity:'rare',      unlock:12, emoji:'🔔' },
       // ===== clothes (NOVO) =====
       { slug:'clothes_pro',  name:'Uniforme Pro',      slot:'clothes',    rarity:'uncommon',  unlock:3,  emoji:'🦺' },
       { slug:'clothes_tux',  name:'Traje Social',      slot:'clothes',    rarity:'rare',      unlock:8,  emoji:'🤵' },
       { slug:'clothes_cyber',name:'Fantasia Cyber',    slot:'clothes',    rarity:'epic',      unlock:15, emoji:'🥷' },
       // ===== backgrounds (NOVO) =====
       { slug:'bg_room',      name:'Sala de Estar',     slot:'background', rarity:'common',    unlock:5,  emoji:'🏠', color:'#dbeafe' },
       { slug:'bg_park',      name:'Parque',            slot:'background', rarity:'uncommon',  unlock:10, emoji:'🌳', color:'#dcfce7' },
       { slug:'bg_office',    name:'Escritório Futurista', slot:'background', rarity:'rare',   unlock:20, emoji:'🌃', color:'#1e293b' },
     ];
   
     const GOAL_DEFS = {
       cliente: [
         { slug:'goal_client_order',  title:'Solicite 1 serviço hoje', desc:'Contrate qualquer serviço', target:1, food:30, xp:50, icon:'🛠️' },
         { slug:'goal_client_review', title:'Avalie 1 serviço',        desc:'Envie uma avaliação',        target:1, food:10, xp:20, icon:'⭐' },
         { slug:'goal_client_fav',    title:'Favorite 1 serviço',      desc:'Adicione aos favoritos',     target:1, food:5,  xp:10, icon:'❤️' },
       ],
       funcionario: [
         { slug:'goal_emp_complete', title:'Conclua 2 serviços hoje', desc:'Finalize 2 pedidos no dia', target:2, food:30, xp:50, icon:'✅' },
         { slug:'goal_emp_punctual', title:'Mantenha pontualidade',   desc:'Pontualidade ≥ 95%',        target:1, food:20, xp:40, icon:'⏱️' },
         { slug:'goal_emp_response', title:'Responda rápido',         desc:'Responder em ≤ 10 min',     target:1, food:15, xp:30, icon:'⚡' },
       ],
     };
   
     const BADGE_DEFS = {
       first_service: { name:'Primeiro Serviço', emoji:'🌟', rarity:'common' },
       '7_day_streak': { name:'Sequência de 7', emoji:'🔥', rarity:'uncommon' },
       top_10_weekly: { name:'Top 10 Semanal', emoji:'🏆', rarity:'rare' },
       level_25: { name:'Veterano', emoji:'👑', rarity:'epic' },
       level_50: { name:'Lenda', emoji:'💎', rarity:'legendary' },
     };
   
     const today = () => new Date().toISOString().slice(0, 10);
     const uid = () => (crypto.randomUUID ? crypto.randomUUID() : 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2));
     const read = (k, fb) => { try { const v = localStorage.getItem(k); return v === null ? fb : JSON.parse(v); } catch { return fb; } };
     const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
     const session = () => read(LS.session, { nome: 'Visitante', email: 'demo@dafix.com', perfil: 'cliente' });
     const audience = () => session().perfil === 'funcionario' ? 'funcionario' : 'cliente';
   
     // ===== Pet =====
     function ensurePet() {
       let pet = read(LS.pet, null);
       if (!pet) {
         // Onboarding: novo usuário recebe 10 comidas = Level 2 imediato (150 XP ÷ 15 = 10)
         pet = {
           id: uid(), name: 'Faísca', level: 1, xp: 0, hunger: 100,
           skin: 'default_blue',
           equipped: { hat: null, collar: null, clothes: null, background: null },
           createdAt: Date.now(), updatedAt: Date.now(),
         };
         write(LS.pet, pet);
         write(LS.food, 10);
         write(LS.inv, ['default_blue', 'collar_red']);
         write(LS.badges, []);
         write(LS.onboarding, { done: false, startedAt: Date.now() });
       } else {
         // Migração: equipar campos que possam estar faltando
         if (!pet.equipped) pet.equipped = {};
         ['hat','collar','clothes','background'].forEach((s) => {
           if (pet.equipped[s] === undefined) pet.equipped[s] = null;
         });
         write(LS.pet, pet);
       }
       return pet;
     }
   
     function getPet() {
       const pet = ensurePet();
       const hours = (Date.now() - pet.updatedAt) / 3600000;
       pet.hunger = Math.max(0, Math.round(pet.hunger - hours * 8));
       return { ...pet, ...xpProgress(pet.xp) };
     }
   
     function savePet(patch) {
       const cur = read(LS.pet, ensurePet());
       const next = { ...cur, ...patch, updatedAt: Date.now() };
       write(LS.pet, next);
       return next;
     }
   
     const getFood = () => read(LS.food, 0);
     const addFood = (n) => { const v = Math.max(0, getFood() + n); write(LS.food, v); return v; };
     const getInventory = () => read(LS.inv, ['default_blue', 'collar_red']);
     const addToInventory = (slug) => { const inv = getInventory(); if (!inv.includes(slug)) { inv.push(slug); write(LS.inv, inv); } };
     const getBadges = () => read(LS.badges, []);
   
     function tryAwardBadges(pet) {
       const owned = new Set(getBadges());
       const news = [];
       if (pet.xp >= 100 && !owned.has('first_service')) news.push('first_service');
       if (pet.level >= 25 && !owned.has('level_25')) news.push('level_25');
       if (pet.level >= 50 && !owned.has('level_50')) news.push('level_50');
       if (news.length) write(LS.badges, [...owned, ...news]);
       return news.map(slug => ({ slug, ...BADGE_DEFS[slug] }));
     }
   
     function getGoalsState() {
       const data = read(LS.goals, null);
       if (!data || data.date !== today()) {
         const fresh = { date: today(), progress: {}, completed: [] };
         GOAL_DEFS[audience()].forEach(g => { fresh.progress[g.slug] = 0; });
         write(LS.goals, fresh);
         return fresh;
       }
       GOAL_DEFS[audience()].forEach(g => { if (data.progress[g.slug] === undefined) data.progress[g.slug] = 0; });
       return data;
     }
   
     function awardXpInternal(amount) {
       const pet = read(LS.pet, ensurePet());
       const newXp = Math.max(0, pet.xp + amount);
       const { level: newLevel } = xpProgress(newXp);
       const levelUp = newLevel > pet.level;
       savePet({ xp: newXp, level: newLevel });
   
       // Auto-unlock de cosméticos quando sobe de nível
       if (levelUp) {
         COSMETICS.forEach((c) => {
           if (c.unlock <= newLevel) addToInventory(c.slug);
         });
       }
   
       const newBadges = tryAwardBadges({ ...pet, xp: newXp, level: newLevel });
       return { xpAwarded: amount, levelUp, newLevel, newXp, newBadges, pet: getPet() };
     }
   
     function progressGoal(slug, amount = 1) {
       const defs = GOAL_DEFS[audience()];
       const def = defs.find(g => g.slug === slug);
       if (!def) return null;
       const st = getGoalsState();
       const cur = st.progress[slug] || 0;
       st.progress[slug] = Math.min(def.target, cur + amount);
       const justCompleted = cur < def.target && st.progress[slug] >= def.target;
       if (justCompleted && !st.completed.includes(slug)) {
         st.completed.push(slug);
         addFood(def.food);
         const xp = awardXpInternal(def.xp);
         const result = {
           type: 'daily_goal_done', label: `Meta concluída: ${def.title}`,
           food: def.food, xp: def.xp, levelUp: xp.levelUp, newLevel: xp.newLevel,
           newXp: xp.newXp, newBadges: xp.newBadges, pet: xp.pet,
         };
         write(LS.goals, st);
         emitLocal('event', result);
         if (result.levelUp) emitLocal('levelup', result);
         return { def, justCompleted: true, progress: st.progress[slug], result };
       }
       write(LS.goals, st);
       return { def, justCompleted: false, progress: st.progress[slug] };
     }
   
     function applyEvent(eventType, payload = {}) {
       const reward = REWARDS[eventType];
       if (!reward) return null;
       const pet = read(LS.pet, ensurePet());
       const hours = (Date.now() - pet.updatedAt) / 3600000;
       pet.hunger = Math.max(0, Math.round(pet.hunger - hours * 8));
       savePet({ hunger: pet.hunger });
       if (reward.food) addFood(reward.food);
       const xp = awardXpInternal(reward.xp);
       const evts = read(LS.events, []);
       evts.push({ id: uid(), type: eventType, at: Date.now(), reward, payload });
       write(LS.events, evts.slice(-200));
       const result = {
         type: eventType, label: reward.label, food: reward.food, xp: reward.xp,
         levelUp: xp.levelUp, newLevel: xp.newLevel, newXp: xp.newXp,
         newBadges: xp.newBadges, pet: xp.pet,
       };
       emitLocal('event', result);
       if (result.levelUp) emitLocal('levelup', result);
       return result;
     }
   
     const getStreak = () => read(LS.streak, { current: 0, lastDate: null });
     function touchStreak() {
       const s = getStreak();
       const t = today();
       if (s.lastDate === t) return s;
       const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
       s.current = (s.lastDate === yesterday) ? s.current + 1 : 1;
       s.lastDate = t;
       write(LS.streak, s);
       return s;
     }
   
     // ===== Onboarding =====
     function getOnboarding() {
       return read(LS.onboarding, { done: true, startedAt: null });
     }
     function markOnboardingDone() {
       write(LS.onboarding, { done: true, completedAt: Date.now() });
     }
   
     const listeners = new Map();
     const on = (evt, fn) => { if (!listeners.has(evt)) listeners.set(evt, new Set()); listeners.get(evt).add(fn); return () => listeners.get(evt).delete(fn); };
     const off = (evt, fn) => listeners.get(evt)?.delete(fn);
     const emitLocal = (evt, data) => { (listeners.get(evt) || []).forEach(fn => { try { fn(data); } catch (e) { console.error(e); } }); };
   
     function getStoreItems() {
       const inv = new Set(getInventory());
       return COSMETICS.map(c => ({ ...c, owned: inv.has(c.slug) }));
     }
     function equipCosmetic(slug) {
       const item = COSMETICS.find(c => c.slug === slug);
       if (!item || !getInventory().includes(slug)) return false;
       if (item.slot === 'skin') savePet({ skin: slug });
       else {
         const pet = read(LS.pet, ensurePet());
         pet.equipped = { ...pet.equipped, [item.slot]: slug };
         savePet({ equipped: pet.equipped });
       }
       return true;
     }
     function unequipSlot(slot) {
       if (slot === 'skin') return savePet({ skin: 'default_blue' });
       const pet = read(LS.pet, ensurePet());
       pet.equipped = { ...pet.equipped, [slot]: null };
       return savePet({ equipped: pet.equipped });
     }
   
     const RANKING_NAMES = [
       'Carlos Mendes','Ana Paula','João Silva','Lucas Ferreira','Fernanda Costa',
       'Roberto Alves','Mariana Souza','Pedro Henrique','Juliana Lima','Rafael Lima',
       'Tatiana Borges','Bruno Martins','Sofia Torres','Diego Fonseca','Camila Rocha',
       'Isabela Nunes','Larissa Campos','Thiago Martins','Beatriz Alves','Marcos Souza',
     ];
     function seedLeaderboard(aud, period) {
       const seed = aud + ':' + period;
       let data = read('dafix.gamif.lb.' + seed, null);
       if (data) return data;
       const hash = [...seed].reduce((a, c) => a + c.charCodeAt(0), 0);
       data = RANKING_NAMES.map((name, i) => {
         const base = ((hash * (i + 1)) % 47);
         const score = aud === 'funcionario' ? 500 + base * 80 + (i * 25) : 300 + base * 40 + (i * 18);
         return {
           name,
           initials: name.split(' ').map(w => w[0]).slice(0, 2).join(''),
           level: 1 + Math.floor(base / 4),
           score: Math.round(score),
           color: ['#2563eb','#10b981','#f59e0b','#8b5cf6','#ec4899','#06b6d4'][i % 6],
         };
       }).sort((a, b) => b.score - a.score);
       write('dafix.gamif.lb.' + seed, data);
       return data;
     }
     function getLeaderboard(aud, period) {
       const base = seedLeaderboard(aud, period);
       const me = getPet();
       const meScore = aud === 'funcionario'
         ? Math.round(me.xp * 0.5 + (session().perfil === 'funcionario' ? 100 : 0))
         : Math.round(me.level * 100 + me.xp * 0.3);
       const myEntry = {
         name: session().nome || 'Você',
         initials: (session().nome || 'VC').split(' ').map(w => w[0]).slice(0, 2).join(''),
         level: me.level, score: meScore, color: '#2563eb', isMe: true,
       };
       const list = [...base, myEntry].sort((a, b) => b.score - a.score);
       list.forEach((e, i) => e.rank = i + 1);
       return { top: list.slice(0, 10), me: list.find(e => e.isMe), total: list.length };
     }
   
     return {
       getPet, savePet, xpProgress, xpForLevel, levelFromXp,
       getFood, addFood, getInventory, addToInventory,
       getGoalsState, progressGoal, getStreak, touchStreak,
       applyEvent, on, off,
       getStoreItems, equipCosmetic, unequipSlot,
       getLeaderboard, getBadges, tryAwardBadges,
       getOnboarding, markOnboardingDone,
       COSMETICS, GOAL_DEFS, BADGE_DEFS, REWARDS,
     };
   })();
   
   window.Gamif = Gamif;
   window.Gamif.emit = (evt, payload = {}) => Gamif.applyEvent(evt, payload);
   
   window.Gamif.on('event', (r) => {
     if (!r.label) return;
     const msg = `+${r.xp} XP${r.food > 0 ? ' · +' + r.food + ' 🍖' : ''}`;
     try {
       if (typeof window._showToast === 'function') {
         window._showToast({ title: r.label, message: msg, type: 'success', duration: 3200 });
       } else if (typeof window._gamifToast === 'function') {
         window._gamifToast(r.label, msg);
       }
     } catch (e) { /* noop */ }
   });
   
   (() => {
     const lastLogin = localStorage.getItem('dafix.gamif.lastLogin');
     if (lastLogin !== today()) {
       localStorage.setItem('dafix.gamif.lastLogin', today());
       setTimeout(() => Gamif.applyEvent('daily_login'), 400);
       Gamif.touchStreak();
     }
   })();