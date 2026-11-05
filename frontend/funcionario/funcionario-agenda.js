/* Página: Agenda */
(function () {
    const MONTHS = ["Janeiro","Fevereiro","Mar\u00e7o","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
    const WEEKDAYS = ["Dom","Seg","Ter","Qua","Qui","Sex","S\u00e1b"];
  
    // Eventos simulados (chave: "YYYY-MM-DD")
    const today = new Date();
    const yr = today.getFullYear(), mo = today.getMonth();
    function key(y,m,d){ return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`; }
  
    const EVENTS = {
      [key(yr,mo, Math.min(today.getDate(),  28))]: [{ title: "Instalação chuveiro", color: "" }, { title: "Conserto elétrico", color: "violet" }],
      [key(yr,mo, Math.min(today.getDate()+1,28))]: [{ title: "Montagem móveis", color: "amber" }],
      [key(yr,mo, Math.min(today.getDate()+3,28))]: [{ title: "Manutenção predial", color: "violet" }, { title: "Reparo torneira", color: "green" }, { title: "Visita técnica", color: "" }],
      [key(yr,mo, Math.min(today.getDate()+5,28))]: [{ title: "Reparo hidráulico", color: "green" }],
      [key(yr,mo, Math.min(today.getDate()+7,28))]: [{ title: "Pintura quarto", color: "rose" }, { title: "Troca chuveiro", color: "" }],
      [key(yr,mo, Math.min(today.getDate()+10,28))]: [{ title: "Emergência elétrica", color: "rose" }]
    };
  
    let current = new Date(yr, mo, 1);
  
    function renderCalendar() {
      const grid = document.getElementById("calGrid");
      const title = document.getElementById("calTitle");
      if (!grid || !title) return;
      title.textContent = `${MONTHS[current.getMonth()]} ${current.getFullYear()}`;
      grid.innerHTML = "";
      WEEKDAYS.forEach((w) => { const el = document.createElement("div"); el.className = "calendar__weekday"; el.textContent = w; grid.appendChild(el); });
  
      const firstDay = new Date(current.getFullYear(), current.getMonth(), 1).getDay();
      const daysInMonth = new Date(current.getFullYear(), current.getMonth()+1, 0).getDate();
      const prevMonthDays = new Date(current.getFullYear(), current.getMonth(), 0).getDate();
  
      const cells = [];
      for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, other: true });
      for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, other: false, dateKey: key(current.getFullYear(), current.getMonth(), d) });
      while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - firstDay + 1, other: true });
  
      const todayKey = key(today.getFullYear(), today.getMonth(), today.getDate());
      cells.forEach((c) => {
        const dayEl = document.createElement("div");
        dayEl.className = "calendar__day" + (c.other ? " calendar__day--other" : "");
        if (!c.other && c.dateKey === todayKey) dayEl.classList.add("calendar__day--today");
        const events = !c.other && EVENTS[c.dateKey] ? EVENTS[c.dateKey] : [];
        if (events.length) dayEl.setAttribute("data-count", events.length);
        dayEl.innerHTML = `<span class="calendar__day-num">${c.day}</span><div class="calendar__events">${events.slice(0,2).map((ev) => `<span class="calendar__event ${ev.color ? `calendar__event--${ev.color}` : ""}">${ev.title}</span>`).join("")}${events.length > 2 ? `<span class="calendar__more">+${events.length-2} mais</span>` : ""}</div>`;
        if (!c.other) dayEl.addEventListener("click", () => {
          const ev = events.length;
          if (window._showToast) window._showToast({ title: `Dia ${c.day} de ${MONTHS[current.getMonth()]}`, message: ev ? `${ev} compromisso(s) neste dia.` : "Sem compromissos. Clique em 'Novo agendamento' para adicionar.", type: "info" });
        });
        grid.appendChild(dayEl);
      });
    }
  
    function renderAgendaList() {
      const list = document.getElementById("agendaList");
      if (!list) return;
      const items = [
        { day: 12, month: "Mar", title: "Instalação de chuveiro", meta: "Mariana Costa · Vila Madalena", time: "14:00 – 15:30", color: "blue", value: 480 },
        { day: 13, month: "Mar", title: "Montagem de móveis", meta: "Tatiana Borges · Moema", time: "09:00 – 12:00", color: "amber", value: 320 },
        { day: 15, month: "Mar", title: "Manutenção elétrica", meta: "Cond. Verde Vida · Itaim Bibi", time: "08:30 – 11:30", color: "violet", value: 720 },
        { day: 17, month: "Mar", title: "Reparo hidráulico", meta: "João Pereira · Tatuapé", time: "15:00 – 16:00", color: "green", value: 240 },
        { day: 18, month: "Mar", title: "Pintura de quarto", meta: "Beatriz Alves · Pinheiros", time: "08:00 – 16:00", color: "rose", value: 620 },
        { day: 20, month: "Mar", title: "Troca de bacia", meta: "Lucas Martins · Vila Mariana", time: "10:00 – 12:00", color: "blue", value: 280 }
      ];
      list.innerHTML = items.map(it => `
        <li class="agenda__item">
          <div class="agenda__date"><span class="agenda__day">${it.day}</span><span class="agenda__month">${it.month}</span></div>
          <div class="agenda__info"><p class="agenda__title">${it.title}</p><p class="agenda__meta">${it.meta}</p><div class="agenda__tags"><span class="chip chip--${it.color}">${it.time}</span><span class="chip chip--soft">R$ ${it.value}</span></div></div>
          <button class="icon-btn icon-btn--sm" data-action="agenda-options" aria-label="Mais"><svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg></button>
        </li>`).join("");
    }
  
    window._initAgendaPage = () => {
      renderCalendar();
      renderAgendaList();
      // Override prev/next/today actions
      document.addEventListener("click", (e) => {
        const t = e.target.closest("[data-action]"); if (!t) return;
        if (t.dataset.action === "calendar-prev") { current.setMonth(current.getMonth() - 1); renderCalendar(); }
        if (t.dataset.action === "calendar-next") { current.setMonth(current.getMonth() + 1); renderCalendar(); }
        if (t.dataset.action === "calendar-today") { current = new Date(yr, mo, 1); renderCalendar(); }
      });
    };
  
    function autoInit() {
      renderCalendar();
      renderAgendaList();
      document.addEventListener("click", (e) => {
        const t = e.target.closest("[data-action]"); if (!t) return;
        if (t.dataset.action === "calendar-prev") { current.setMonth(current.getMonth() - 1); renderCalendar(); }
        if (t.dataset.action === "calendar-next") { current.setMonth(current.getMonth() + 1); renderCalendar(); }
        if (t.dataset.action === "calendar-today") { current = new Date(yr, mo, 1); renderCalendar(); }
      });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", autoInit);
    else setTimeout(autoInit, 0);
  })();
  