/* Página: Gestão de Serviços */
(function () {
    const $  = (s, c=document) => c.querySelector(s);
    const $$ = (s, c=document) => Array.from(c.querySelectorAll(s));
    const STORAGE_KEY = "mda.pro.services";
  
    const CAT_LABELS = {
      eletrica: "Elétrica", hidraulica: "Hidráulica", montagem: "Montagem",
      pintura: "Pintura", marcenaria: "Marcenaria", geral: "Geral"
    };
  
    const ICONS = {
      eletrica:  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      hidraulica:'<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2s7 7 7 12a7 7 0 1 1-14 0c0-5 7-12 7-12Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      montagem:  '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17l3 3 5.3-5.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2-2 2.4-2.4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      pintura:   '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 6h12v6H4zM6 12v6a2 2 0 0 0 2 2h2v-4M18 6h2v6h-7" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
      geral:     '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7h18v12H3z" stroke="currentColor" stroke-width="1.8"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" stroke-width="1.8"/></svg>'
    };
    const COLORS = {
      eletrica: "info", hidraulica: "teal", montagem: "violet", pintura: "rose", marcenaria: "amber", geral: "green"
    };
  
    const DEFAULT_SERVICES = [
      { id: 1, name: "Instalação de chuveiro elétrico", category: "eletrica", catLabel: "Elétrica", price: 180, time: "1h", warranty: "90 dias", desc: "Instalação completa de chuveiro com testes e ajustes elétricos.", active: true, popular: true },
      { id: 2, name: "Conserto de tomadas e interruptores", category: "eletrica", catLabel: "Elétrica", price: 120, time: "45min", warranty: "90 dias", desc: "Troca, instalação e reparo de pontos elétricos residenciais.", active: true },
      { id: 3, name: "Instalação de lustres e luminárias", category: "eletrica", catLabel: "Elétrica", price: 150, time: "1h", warranty: "30 dias", desc: "Inclui fixação, fiação e testes de funcionamento.", active: true },
      { id: 4, name: "Manutenção elétrica predial", category: "eletrica", catLabel: "Elétrica", price: 480, time: "3h", warranty: "180 dias", desc: "Serviço de manutenção preventiva e corretiva em prédios.", active: true },
      { id: 5, name: "Reparo hidráulico residencial", category: "hidraulica", catLabel: "Hidráulica", price: 220, time: "1h30", warranty: "90 dias", desc: "Conserto de vazamentos, torneiras e tubulações.", active: true, popular: true },
      { id: 6, name: "Desentupimento de pia/ralo", category: "hidraulica", catLabel: "Hidráulica", price: 160, time: "45min", warranty: "30 dias", desc: "Serviço de desentupimento rápido com equipamento profissional.", active: true },
      { id: 7, name: "Instalação de bacia e caixa acoplada", category: "hidraulica", catLabel: "Hidráulica", price: 280, time: "2h", warranty: "90 dias", desc: "Troca completa de bacia sanitária com vedante e testes.", active: false },
      { id: 8, name: "Montagem de móveis simples", category: "montagem", catLabel: "Montagem", price: 120, time: "1h", warranty: "30 dias", desc: "Mesas, cadeiras, estantes e móveis até 6 peças.", active: true },
      { id: 9, name: "Montagem de móveis grandes", category: "montagem", catLabel: "Montagem", price: 240, time: "2h30", warranty: "30 dias", desc: "Guarda-roupas, cozinhas planejadas e armários.", active: true },
      { id: 10, name: "Pintura de parede (cm²)", category: "pintura", catLabel: "Pintura", price: 380, time: "4h", warranty: "180 dias", desc: "Pintura por metro quadrado com massa corrida e tinta acrílica.", active: true },
      { id: 11, name: "Pequenos reparos domésticos", category: "geral", catLabel: "Geral", price: 90, time: "30min", warranty: "30 dias", desc: "Apertos, ajustes, troca de peças e pequenos consertos.", active: true, popular: true },
      { id: 12, name: "Serviço de emergência (24h)", category: "geral", catLabel: "Geral", price: 350, time: "varia", warranty: "30 dias", desc: "Atendimento emergencial em qualquer horário.", active: true }
    ];
  
    let SERVICES = [];
  
    function loadServices() {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
        if (Array.isArray(saved) && saved.length) return saved;
      } catch { /* ignore */ }
      return DEFAULT_SERVICES.map(s => ({ ...s }));
    }
  
    function saveServices() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SERVICES));
    }
  
    function cardHTML(s) {
      const color = COLORS[s.category] || "primary";
      const icon = ICONS[s.category] || ICONS.geral;
      return `
        <article class="service-card" data-service-id="${s.id}" data-category="${s.category}" data-name="${s.name.toLowerCase()}">
          <div class="service-card__status">${s.popular ? '<span class="chip chip--soft">Popular</span>' : s.active ? '<span class="chip chip--green">Ativo</span>' : '<span class="chip">Pausado</span>'}</div>
          <header class="service-card__head">
            <span class="service-card__icon metric__icon metric__icon--${color === 'green' ? 'green' : color === 'info' ? 'blue' : color === 'teal' ? 'teal' : color === 'violet' ? 'violet' : color === 'rose' ? 'rose' : color === 'amber' ? 'amber' : 'blue'}">${icon}</span>
          </header>
          <div>
            <p class="service-card__cat">${s.catLabel}</p>
            <p class="service-card__title">${s.name}</p>
          </div>
          <p class="service-card__desc">${s.desc}</p>
          <div class="service-card__meta">
            <p class="service-card__price">R$ ${s.price.toLocaleString("pt-BR")}<small> · ${s.time}</small></p>
            <div class="service-card__actions">
              <button class="icon-btn icon-btn--sm" data-action="edit-service" aria-label="Editar"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 20h4l10-10-4-4L4 16v4Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg></button>
              <button class="icon-btn icon-btn--sm" data-action="delete-service" aria-label="Excluir" style="color:var(--danger)"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></button>
            </div>
          </div>
        </article>`;
    }
  
    function render(list) {
      const grid = document.getElementById("servicesGrid");
      if (!grid) return;
      if (!list.length) {
        grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state__icon"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="1.8"/><path d="M20 20l-3.5-3.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg></span><h3>Nenhum serviço encontrado</h3><p>Tente outros filtros ou adicione um novo serviço.</p><button class="btn btn--primary" type="button" data-action="open-add-service">Adicionar serviço</button></div>`;
        return;
      }
      grid.innerHTML = list.map(cardHTML).join("");
    }
  
    let currentFilter = "all";
    let currentSearch = "";
  
    function apply() {
      let list = SERVICES.slice();
      if (currentFilter !== "all") list = list.filter(s => s.category === currentFilter);
      if (currentSearch) list = list.filter(s => s.name.toLowerCase().includes(currentSearch) || s.catLabel.toLowerCase().includes(currentSearch));
      render(list);
    }
  
    window._getServiceById = (id) => SERVICES.find(s => s.id === +id) || null;
  
    window._updateService = (id, data) => {
      const idx = SERVICES.findIndex(s => s.id === +id);
      if (idx === -1) return false;
      SERVICES[idx] = { ...SERVICES[idx], ...data, id: SERVICES[idx].id, catLabel: CAT_LABELS[data.category] || SERVICES[idx].catLabel };
      saveServices();
      apply();
      return true;
    };
  
    window._deleteService = (id) => {
      const idx = SERVICES.findIndex(s => s.id === +id);
      if (idx === -1) return false;
      SERVICES.splice(idx, 1);
      saveServices();
      apply();
      return true;
    };
  
    window._addService = (data) => {
      const service = {
        id: Date.now(),
        active: true,
        popular: false,
        catLabel: CAT_LABELS[data.category] || data.category,
        ...data
      };
      SERVICES.push(service);
      saveServices();
      apply();
      return service;
    };
  
    window._renderServices = () => apply();
    window._applyFilter = (f) => { currentFilter = f; apply(); };
    window._applySearch = (term) => { currentSearch = term; apply(); };
    window._initServicesPage = () => {
      SERVICES = loadServices();
      apply();
      const sSearch = document.getElementById("serviceSearch");
      sSearch && sSearch.addEventListener("input", (e) => { currentSearch = e.target.value.toLowerCase(); apply(); });
    };
  
    function autoInit() {
      SERVICES = loadServices();
      apply();
      const sSearch = document.getElementById("serviceSearch");
      sSearch && sSearch.addEventListener("input", (e) => { currentSearch = e.target.value.toLowerCase(); apply(); });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoInit);
    else setTimeout(autoInit, 0);
  })();
  