/* ============================================================
   Dafix — Auth logic (Vanilla ES6+)
   - i18n (PT/EN), theme toggle, tabs, profile segmented control
   - real-time validation, masks, password strength
   - JSON-driven simulated auth + localStorage persistence
   - forgot-password modal, toasts, micro-interactions
   ============================================================ */
   (() => {
    "use strict";
  
    /* ----------------- i18n dictionary ----------------- */
    const I18N = {
      pt: {
        "brand.name": "Dafix",
        "panel.title": "A plataforma segura para gerir clientes e equipe.",
        "panel.slogan": "Tecnologia confiável, experiência impecável. Tudo em um só lugar.",
        "benefit.secure": "Plataforma 100% segura",
        "benefit.crypto": "Criptografia de ponta a ponta",
        "benefit.support": "Atendimento 24 horas",
        "stat.users.num": "+10.000",
        "stat.users.label": "usuários ativos",
        "stat.uptime.label": "disponibilidade",
        "stat.support.label": "suporte ativo",
        "float.secure.title": "Conexão segura",
        "float.secure.sub": "SSL / TLS 256-bit",
        "float.welcome.title": "Bem-vindo de volta",
        "float.welcome.sub": "Acesso instantâneo",
        "tab.login": "Login",
        "tab.signup": "Cadastro",
        "profile.client": "Cliente",
        "profile.staff": "Funcionário",
        "field.email.label": "E-mail",
        "field.emailCorp.label": "E-mail corporativo",
        "field.email.ph": "voce@exemplo.com",
        "field.emailCorp.ph": "voce@empresa.com",
        "field.password.label": "Senha",
        "field.name.label": "Nome completo",
        "field.name.ph": "Seu nome completo",
        "field.phone.label": "Telefone",
        "field.cpf.label": "CPF",
        "field.spec.label": "Especialidade",
        "field.spec.ph": "Ex.: Suporte técnico",
        "field.area.label": "Área de atuação",
        "field.area.ph": "Ex.: Atendimento",
        "field.confirm.label": "Confirmar senha",
        "login.remember": "Lembrar acesso",
        "login.forgot": "Esqueci minha senha",
        "login.submit": "Entrar",
        "signup.terms": "Concordo com os Termos de Uso e a Política de Privacidade",
        "signup.submit": "Criar conta",
        "legal.text": "Seus dados são protegidos e criptografados.",
        "modal.title": "Recuperação de senha",
        "modal.desc": "Digite seu e-mail e enviaremos as instruções para redefinir sua senha.",
        "modal.cancel": "Cancelar",
        "modal.send": "Enviar link",
        "modal.successTitle": "E-mail enviado!",
        "modal.ok": "Entendi",
        "card.login.client.title": "Acesse sua conta",
        "card.login.client.sub": "Entre como cliente para continuar na Dafix.",
        "card.login.staff.title": "Acesso da equipe",
        "card.login.staff.sub": "Entre com seu e-mail corporativo Dafix.",
        "card.signup.client.title": "Crie sua conta",
        "card.signup.client.sub": "Cadastre-se como cliente em poucos segundos.",
        "card.signup.staff.title": "Cadastro da equipe",
        "card.signup.staff.sub": "Crie seu acesso corporativo Dafix.",
        "strength.weak": "Senha fraca",
        "strength.medium": "Senha média",
        "strength.strong": "Senha forte",
        "v.required": "Este campo é obrigatório.",
        "v.email": "Informe um e-mail válido.",
        "v.name": "Informe nome e sobrenome.",
        "v.phone": "Telefone inválido. Use DDD + número.",
        "v.cpf": "CPF inválido.",
        "v.password": "Mínimo de 8 caracteres.",
        "v.confirm": "As senhas não coincidem.",
        "v.terms": "Você precisa aceitar os termos.",
        "toast.welcome.title": "Login realizado",
        "toast.created.title": "Cadastro concluído",
        "toast.error.title": "Não foi possível continuar",
        "toast.sent.title": "E-mail enviado"
      },
      en: {
        "brand.name": "Dafix",
        "panel.title": "The secure platform to manage clients and team.",
        "panel.slogan": "Reliable technology, flawless experience. All in one place.",
        "benefit.secure": "100% secure platform",
        "benefit.crypto": "End-to-end encryption",
        "benefit.support": "24-hour support",
        "stat.users.num": "+10,000",
        "stat.users.label": "active users",
        "stat.uptime.label": "uptime",
        "stat.support.label": "live support",
        "float.secure.title": "Secure connection",
        "float.secure.sub": "SSL / TLS 256-bit",
        "float.welcome.title": "Welcome back",
        "float.welcome.sub": "Instant access",
        "tab.login": "Login",
        "tab.signup": "Sign up",
        "profile.client": "Client",
        "profile.staff": "Employee",
        "field.email.label": "Email",
        "field.emailCorp.label": "Corporate email",
        "field.email.ph": "you@example.com",
        "field.emailCorp.ph": "you@company.com",
        "field.password.label": "Password",
        "field.name.label": "Full name",
        "field.name.ph": "Your full name",
        "field.phone.label": "Phone",
        "field.cpf.label": "CPF",
        "field.spec.label": "Specialty",
        "field.spec.ph": "e.g. Technical support",
        "field.area.label": "Area of work",
        "field.area.ph": "e.g. Customer service",
        "field.confirm.label": "Confirm password",
        "login.remember": "Remember me",
        "login.forgot": "Forgot password?",
        "login.submit": "Sign in",
        "signup.terms": "I agree to the Terms of Use and Privacy Policy",
        "signup.submit": "Create account",
        "legal.text": "Your data is protected and encrypted.",
        "modal.title": "Password recovery",
        "modal.desc": "Enter your email and we'll send instructions to reset your password.",
        "modal.cancel": "Cancel",
        "modal.send": "Send link",
        "modal.successTitle": "Email sent!",
        "modal.ok": "Got it",
        "card.login.client.title": "Sign in to your account",
        "card.login.client.sub": "Sign in as a client to continue on Dafix.",
        "card.login.staff.title": "Team access",
        "card.login.staff.sub": "Sign in with your Dafix corporate email.",
        "card.signup.client.title": "Create your account",
        "card.signup.client.sub": "Sign up as a client in seconds.",
        "card.signup.staff.title": "Team registration",
        "card.signup.staff.sub": "Create your Dafix corporate access.",
        "strength.weak": "Weak password",
        "strength.medium": "Medium password",
        "strength.strong": "Strong password",
        "v.required": "This field is required.",
        "v.email": "Enter a valid email.",
        "v.name": "Enter first and last name.",
        "v.phone": "Invalid phone. Use area code + number.",
        "v.cpf": "Invalid CPF.",
        "v.password": "Minimum of 8 characters.",
        "v.confirm": "Passwords do not match.",
        "v.terms": "You must accept the terms.",
        "toast.welcome.title": "Signed in",
        "toast.created.title": "Registration complete",
        "toast.error.title": "Couldn't continue",
        "toast.sent.title": "Email sent"
      }
    };
  
    /* ----------------- State ----------------- */
    const state = {
      lang: localStorage.getItem("dafix_lang") || "pt",
      theme: localStorage.getItem("dafix_theme") || "light",
      tab: "login",       // login | signup
      profile: "cliente", // cliente | funcionario
    };
  
    let DATA = null;
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const t = (k) => (I18N[state.lang] && I18N[state.lang][k]) || k;
  
    /* ----------------- Data loading ----------------- */
    async function loadData() {
      try {
        const res = await fetch("/data.json", { cache: "no-store" });
        DATA = await res.json();
      } catch (e) {
        DATA = { config: { sistema: "Dafix" }, clientes: [], funcionarios: [], mensagens: { pt: {}, en: {} } };
      }
    }
    const STORE_KEY = "dafix_users";
    function getStored() {
      try { return JSON.parse(localStorage.getItem(STORE_KEY)) || { clientes: [], funcionarios: [] }; }
      catch { return { clientes: [], funcionarios: [] }; }
    }
    function persist(group, user) {
      const s = getStored();
      s[group] = s[group] || [];
      s[group].push(user);
      localStorage.setItem(STORE_KEY, JSON.stringify(s));
    }
    function allUsers(group) {
      const seed = (DATA && DATA[group]) || [];
      return seed.concat(getStored()[group] || []);
    }
    function msg(key, vars = {}) {
      const m = (DATA && DATA.mensagens && DATA.mensagens[state.lang]) || {};
      let str = m[key] || key;
      Object.keys(vars).forEach((k) => { str = str.replace(`{${k}}`, vars[k]); });
      return str;
    }
  
    /* ----------------- i18n apply ----------------- */
    function applyI18n() {
      document.documentElement.lang = state.lang === "pt" ? "pt-BR" : "en";
      $$("[data-i18n]").forEach((el) => { el.textContent = t(el.getAttribute("data-i18n")); });
      $$("[data-i18n-ph]").forEach((el) => { el.placeholder = t(el.getAttribute("data-i18n-ph")); });
      $("#langLabel").textContent = state.lang.toUpperCase();
      refreshDynamicTexts();
    }
  
    function refreshDynamicTexts() {
      // Card title/subtitle by tab + profile
      const p = state.profile === "cliente" ? "client" : "staff";
      $("#cardTitle").textContent = t(`card.${state.tab}.${p}.title`);
      $("#cardSubtitle").textContent = t(`card.${state.tab}.${p}.sub`);
  
      // Email labels/placeholders depend on profile (corporate vs personal)
      const corp = state.profile === "funcionario";
      [["login-email", "field.email.label", "field.emailCorp.label"],
       ["su-email", "field.email.label", "field.emailCorp.label"]].forEach(([id, normal, corpKey]) => {
        const input = document.getElementById(id);
        if (!input) return;
        const label = input.closest(".field").querySelector("label");
        label.textContent = corp ? t(corpKey) : t(normal);
        input.placeholder = corp ? t("field.emailCorp.ph") : t("field.email.ph");
      });
    }
  
    /* ----------------- Theme ----------------- */
    function applyTheme() {
      document.documentElement.setAttribute("data-theme", state.theme);
      $("#themeToggle").setAttribute("aria-label", state.theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
    }
  
    /* ----------------- Tabs ----------------- */
    function setTab(tab) {
      state.tab = tab;
      $(".tabs").setAttribute("data-active", tab);
      $$(".tab").forEach((b) => {
        const active = b.dataset.tab === tab;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", String(active));
      });
      const login = $("#panel-login"), signup = $("#panel-signup");
      if (tab === "login") {
        signup.hidden = true; signup.classList.remove("is-active");
        login.hidden = false; login.classList.add("is-active");
      } else {
        login.hidden = true; login.classList.remove("is-active");
        signup.hidden = false; signup.classList.add("is-active");
      }
      refreshDynamicTexts();
    }
  
    /* ----------------- Profile segmented control ----------------- */
    function setProfile(profile) {
      state.profile = profile;
      $(".seg").setAttribute("data-profile", profile);
      $$(".seg__opt").forEach((b) => {
        const active = b.dataset.profile === profile;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-checked", String(active));
      });
      // Toggle staff-only fields
      const staffWrap = $("[data-staff]");
      staffWrap.hidden = profile !== "funcionario";
      refreshDynamicTexts();
    }
  
    /* ----------------- Masks ----------------- */
    function maskPhone(v) {
      v = v.replace(/\D/g, "").slice(0, 11);
      if (v.length <= 2) return v.replace(/(\d{0,2})/, "($1");
      if (v.length <= 6) return v.replace(/(\d{2})(\d{0,4})/, "($1) $2");
      if (v.length <= 10) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
      return v.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
    }
    function maskCPF(v) {
      v = v.replace(/\D/g, "").slice(0, 11);
      return v
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
  
    /* ----------------- Validators ----------------- */
    const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    function validCPF(cpf) {
      cpf = (cpf || "").replace(/\D/g, "");
      if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
      let sum = 0;
      for (let i = 0; i < 9; i++) sum += parseInt(cpf[i]) * (10 - i);
      let d1 = (sum * 10) % 11; if (d1 === 10) d1 = 0;
      if (d1 !== parseInt(cpf[9])) return false;
      sum = 0;
      for (let i = 0; i < 10; i++) sum += parseInt(cpf[i]) * (11 - i);
      let d2 = (sum * 10) % 11; if (d2 === 10) d2 = 0;
      return d2 === parseInt(cpf[10]);
    }
    function validPhone(v) {
      const d = (v || "").replace(/\D/g, "");
      return d.length === 10 || d.length === 11;
    }
  
    // returns { ok, msg }
    function validateField(input) {
      const type = input.dataset.validate;
      const val = (input.value || "").trim();
      if (!type) return { ok: true };
  
      switch (type) {
        case "email":
          if (!val) return { ok: false, msg: t("v.required") };
          return reEmail.test(val) ? { ok: true } : { ok: false, msg: t("v.email") };
        case "name":
          if (!val) return { ok: false, msg: t("v.required") };
          return val.split(/\s+/).length >= 2 && val.length >= 3 ? { ok: true } : { ok: false, msg: t("v.name") };
        case "phone":
          if (!val) return { ok: false, msg: t("v.required") };
          return validPhone(val) ? { ok: true } : { ok: false, msg: t("v.phone") };
        case "cpf":
          if (!val) return { ok: false, msg: t("v.required") };
          return validCPF(val) ? { ok: true } : { ok: false, msg: t("v.cpf") };
        case "password":
          if (!val) return { ok: false, msg: t("v.required") };
          return val.length >= 8 ? { ok: true } : { ok: false, msg: t("v.password") };
        case "confirm": {
          const pw = $("#su-password").value;
          if (!val) return { ok: false, msg: t("v.required") };
          return val === pw ? { ok: true } : { ok: false, msg: t("v.confirm") };
        }
        case "staff":
          if (state.profile !== "funcionario") return { ok: true };
          return val ? { ok: true } : { ok: false, msg: t("v.required") };
        default:
          return { ok: true };
      }
    }
  
    function paintField(input, result, { showValid = true } = {}) {
      const field = input.closest(".field");
      if (!field) return;
      const hint = field.querySelector("[data-hint]");
      field.classList.remove("is-valid", "is-invalid");
      if (result.ok) {
        if (showValid && input.value.trim()) field.classList.add("is-valid");
        if (hint) hint.textContent = "";
      } else {
        field.classList.add("is-invalid");
        if (hint) hint.textContent = result.msg || "";
      }
    }
  
    /* ----------------- Password strength ----------------- */
    function updateStrength(input) {
      const wrap = input.closest(".field").querySelector("[data-strength]");
      if (!wrap) return;
      const v = input.value;
      if (!v) { wrap.hidden = true; return; }
      wrap.hidden = false;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      const bar = wrap.querySelector(".strength__bar");
      const label = wrap.querySelector("[data-strength-label]");
      let w = "33%", c = "var(--red-500)", key = "strength.weak";
      if (score >= 4) { w = "100%"; c = "var(--green-500)"; key = "strength.strong"; }
      else if (score >= 2) { w = "66%"; c = "var(--orange-500)"; key = "strength.medium"; }
      bar.style.setProperty("--w", w);
      bar.style.setProperty("--c", c);
      label.textContent = t(key);
    }
  
    /* ----------------- Toasts ----------------- */
    function toast(type, title, message) {
      const wrap = $("#toasts");
      const el = document.createElement("div");
      el.className = `toast toast--${type}`;
      el.setAttribute("data-testid", "toast");
      const icons = {
        success: '<path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/>',
        error: '<path fill="currentColor" d="M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3l6.3 6.3 6.3-6.3z"/>',
        info: '<path fill="currentColor" d="M11 7h2v2h-2V7Zm0 4h2v6h-2v-6Zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z"/>'
      };
      el.innerHTML = `<span class="toast__ic"><svg viewBox="0 0 24 24" width="18" height="18">${icons[type] || icons.info}</svg></span>
        <div class="toast__body"><strong>${title}</strong><span>${message}</span></div>`;
      wrap.appendChild(el);
      const remove = () => { el.classList.add("is-out"); setTimeout(() => el.remove(), 320); };
      setTimeout(remove, 4200);
      el.addEventListener("click", remove);
    }
  
    /* ----------------- Button loading ----------------- */
    function withLoading(btn, fn, delay = 1100) {
      btn.classList.add("is-loading");
      btn.disabled = true;
      setTimeout(() => {
        btn.classList.remove("is-loading");
        btn.disabled = false;
        fn();
      }, delay);
    }
  
    /* ----------------- Form helpers ----------------- */
    function validateForm(form, { showValid = true } = {}) {
      let ok = true;
      let firstInvalid = null;
      $$("[data-validate]", form).forEach((input) => {
        // Skip hidden staff fields
        if (input.closest("[data-staff]") && input.closest("[data-staff]").hidden) {
          input.closest(".field").classList.remove("is-valid", "is-invalid");
          return;
        }
        if (input.type === "checkbox") {
          const wrap = input.closest(".check");
          if (input.dataset.validate === "terms" && !input.checked) {
            ok = false; wrap.classList.add("is-invalid");
            if (!firstInvalid) firstInvalid = input;
          } else {
            wrap.classList.remove("is-invalid");
          }
          return;
        }
        const res = validateField(input);
        paintField(input, res, { showValid });
        if (!res.ok) { ok = false; if (!firstInvalid) firstInvalid = input; }
      });
      if (firstInvalid) firstInvalid.focus();
      return ok;
    }
  
    /* ----------------- Rotas pós-login ----------------- */
const ROUTES = {
  cliente:     "/cliente/index.html",
  funcionario: "/funcionario/funcionario-dashboard.html",
  admin:       "/admin/dashboard.html",           // opcional
};

function handleLogin() {
  const form = $("#panel-login");
  const btn  = $("[data-submit]", form);

  if (!validateForm(form)) {
    toast("error", t("toast.error.title"), msg("formErro"));
    return;
  }

  const email = $("#login-email").value.trim().toLowerCase();
  const pw    = $("#login-password").value;
  const group = state.profile === "cliente" ? "clientes" : "funcionarios";

  withLoading(btn, () => {
    const list  = allUsers(group);
    const found = list.find((u) => (u.email || "").toLowerCase() === email);

    if (!found)       { toast("error", t("toast.error.title"), msg("loginPerfilErro")); return; }
    if (found.senha !== pw) { toast("error", t("toast.error.title"), msg("loginErro")); return; }

    /* 1) Lembrar e-mail */
    if ($("#remember").checked) localStorage.setItem("dafix_last_email", email);

    /* 2) Guardar sessão para os dashboards lerem quem entrou */
    localStorage.setItem("dafix_session", JSON.stringify({
      nome:   found.nome,
      email:  found.email,
      perfil: state.profile,
      loginAt: Date.now(),
    }));

    /* 3) Sucesso */
    toast("success", t("toast.welcome.title"), msg("loginSucesso", { nome: found.nome }));

    /* 4) Redirecionar (dá ~900ms para o toast aparecer) */
    const destino = ROUTES[state.profile] || "/";
    setTimeout(() => { window.location.href = destino; }, 900);
  });
}
  
    function handleSignup() {
      const form = $("#panel-signup");
      const btn = $("[data-submit]", form);
      if (!validateForm(form)) { toast("error", t("toast.error.title"), msg("formErro")); return; }
      const email = $("#su-email").value.trim().toLowerCase();
      const group = state.profile === "cliente" ? "clientes" : "funcionarios";
      withLoading(btn, () => {
        if (allUsers(group).some((u) => (u.email || "").toLowerCase() === email)) {
          toast("error", t("toast.error.title"), msg("cadastroEmailExiste"));
          return;
        }
        const user = {
          nome: $("#su-name").value.trim(),
          email,
          telefone: $("#su-phone").value.trim(),
          cpf: $("#su-cpf").value.trim(),
          senha: $("#su-password").value,
        };
        if (group === "funcionarios") {
          user.especialidade = $("#su-spec").value.trim();
          user.area = $("#su-area").value.trim();
        }
        persist(group, user);
        toast("success", t("toast.created.title"), msg("cadastroSucesso", { nome: user.nome }));
        form.reset();
        $$(".field", form).forEach((f) => f.classList.remove("is-valid", "is-invalid"));
        $("[data-strength]", form).hidden = true;
        $("#terms").closest(".check").classList.remove("is-invalid");
        setTab("login");
        $("#login-email").value = email;
      });
    }
  
    /* ----------------- Modal (forgot password) ----------------- */
    const modal = $("#forgotModal");
    let lastFocused = null;
    function openModal() {
      lastFocused = document.activeElement;
      modal.hidden = false;
      $("[data-modal-success]").hidden = true;
      $("#forgotForm").hidden = false;
      $("#forgotForm").reset();
      $("#forgot-email").closest(".field").classList.remove("is-valid", "is-invalid");
      setTimeout(() => $("#forgot-email").focus(), 60);
      document.addEventListener("keydown", onModalKey);
    }
    function closeModal() {
      modal.hidden = true;
      document.removeEventListener("keydown", onModalKey);
      if (lastFocused) lastFocused.focus();
    }
    function onModalKey(e) {
      if (e.key === "Escape") { closeModal(); return; }
      if (e.key === "Tab") {
        const focusables = $$('button, [href], input, [tabindex]:not([tabindex="-1"])', modal)
          .filter((el) => !el.disabled && el.offsetParent !== null);
        if (!focusables.length) return;
        const first = focusables[0], last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }
    function handleForgot() {
      const input = $("#forgot-email");
      const res = validateField(input);
      paintField(input, res);
      if (!res.ok) return;
      const btn = $("[data-submit]", $("#forgotForm"));
      withLoading(btn, () => {
        const email = input.value.trim();
        $("#forgotForm").hidden = true;
        const success = $("[data-modal-success]");
        success.hidden = false;
        $("[data-modal-success-msg]").textContent = msg("senhaEnviada", { email });
        toast("success", t("toast.sent.title"), msg("senhaEnviada", { email }));
      }, 1000);
    }
  
    /* ----------------- Wire up events ----------------- */
    function bind() {
      // Theme & language
      $("#themeToggle").addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        localStorage.setItem("dafix_theme", state.theme);
        applyTheme();
      });
      $("#langToggle").addEventListener("click", () => {
        state.lang = state.lang === "pt" ? "en" : "pt";
        localStorage.setItem("dafix_lang", state.lang);
        applyI18n();
      });
  
      // Tabs
      $$(".tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
      // Profile
      $$(".seg__opt").forEach((b) => b.addEventListener("click", () => setProfile(b.dataset.profile)));
  
      // Password visibility
      $$("[data-toggle-pw]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const input = btn.parentElement.querySelector("input");
          input.type = input.type === "password" ? "text" : "password";
          btn.setAttribute("aria-label", input.type === "password" ? "Mostrar senha" : "Ocultar senha");
        });
      });
  
      // Masks + live validation
      $$("input[data-mask], input[data-validate]").forEach((input) => {
        if (input.type === "checkbox") {
          input.addEventListener("change", () => {
            if (input.dataset.validate === "terms" && input.checked)
              input.closest(".check").classList.remove("is-invalid");
          });
          return;
        }
        input.addEventListener("input", () => {
          if (input.dataset.mask === "phone") input.value = maskPhone(input.value);
          if (input.dataset.mask === "cpf") input.value = maskCPF(input.value);
          if (input.id === "su-password") updateStrength(input);
          // live validate only after first blur (tracked by data-touched)
          if (input.dataset.touched) paintField(input, validateField(input));
          // keep confirm in sync
          if (input.id === "su-password") {
            const c = $("#su-password2");
            if (c && c.dataset.touched) paintField(c, validateField(c));
          }
        });
        input.addEventListener("blur", () => {
          input.dataset.touched = "1";
          if (input.value.trim() || input.dataset.validate) paintField(input, validateField(input));
        });
      });
  
      // Submits
      $("#panel-login").addEventListener("submit", (e) => { e.preventDefault(); handleLogin(); });
      $("#panel-signup").addEventListener("submit", (e) => { e.preventDefault(); handleSignup(); });
      $("#forgotForm").addEventListener("submit", (e) => { e.preventDefault(); handleForgot(); });
  
      // Modal open/close
      $("#forgotLink").addEventListener("click", openModal);
      $$("[data-close-modal]").forEach((el) => el.addEventListener("click", closeModal));
    }
  
    /* ----------------- Init ----------------- */
    async function init() {
      applyTheme();
      bind();
      setTab("login");
      setProfile("cliente");
      await loadData();
      applyI18n();
      // Prefill remembered email
      const last = localStorage.getItem("dafix_last_email");
      if (last) { $("#login-email").value = last; $("#remember").checked = true; }
    }
  
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  })();
  