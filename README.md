# DaFix

Plataforma de serviços residenciais com quatro áreas integradas:

- **Pública** — apresentação, catálogo e busca de profissionais.
- **Cliente** — pedidos, perfil e o **Pet/Streak** (gamificação).
- **Funcionário** — agenda, pedidos disponíveis e perfil profissional.
- **Administração** — catálogo, pessoas e relatórios.

O projeto é **JavaScript puro com Node.js + SQLite**, sem etapa de compilação. As páginas são HTML/CSS/JS servidas pelo próprio backend, e os dados vivem em `backend/banco.db`.

> Este README funciona como **guia estrutural**: mostra o mapa do projeto, as rotas, as regras de negócio e o caminho para estender cada parte.

---

## 1. Requisitos

| Ferramenta | Versão mínima | Como conferir |
|---|---|---|
| Node.js | 20 (recomendado 24) | `node -v` |
| npm | 10 | `npm -v` |
| Git | qualquer | `git --version` |

A instalação de dependências precisa de internet na primeira vez.

---

## 2. Como rodar

### 2.1 Instalar dependências

Na raiz do projeto:

```bash
npm ci --prefix backend
```

Isso instala o `sqlite3` e demais pacotes listados em `backend/package.json`, e cria `backend/node_modules/` (que **não** vai para o Git).

### 2.2 Subir o servidor

```bash
node backend/server.js
```

Saída esperada:

```
  Pronto! Gravando em banco.db (SQLite).

      http://localhost:5000

  Para desligar, aperte Ctrl+C aqui nesta janela.
```

Mantenha essa janela aberta. Ela é o servidor — fechou, o site para de responder.

### 2.3 No Windows (atalho)

Dê duplo clique em **`backend/abrir.bat`**. Ele sobe o servidor e abre o navegador sozinho em `http://localhost:5000/`.

### 2.4 Páginas úteis

| URL | O que é |
|---|---|
| `http://localhost:5000/` | Login e cadastro (clientes e funcionários) |
| `http://localhost:5000/landing.html` | Landing pública |
| `http://localhost:5000/publico/servicos.html` | Catálogo e busca |
| `http://localhost:5000/publico/institucional.html` | Sobre nós / contato |
| `http://localhost:5000/suporte/index.html` | Central de ajuda |
| `http://localhost:5000/admin-login.html` | Acesso administrativo |
| `http://localhost:5000/admin/dashboard.html` | Painel do admin (após login) |

Abrir os arquivos HTML **direto pelo disco** (`file:///...`) não funciona: o frontend depende da API do backend, que só responde com o servidor rodando.

---

## 3. Mapa da estrutura

```text
dafix/
│
├── README.md                       Este guia
├── .gitignore                      Impede subir node_modules e banco.db
│
├── backend/                        Servidor e regras de negócio
│   ├── server.js                   ← Ponto de entrada HTTP
│   ├── db.js                       ← Schema SQLite + migrações
│   ├── auth.js                     ← Hash de senha e sessão por cookie
│   ├── banco.db                    ← Banco local (ignorado pelo Git)
│   ├── criar-admin.js              ← CLI para promover uma conta a admin
│   ├── tornar-premium.js           ← CLI para marcar conta como premium
│   ├── package.json
│   ├── package-lock.json
│   ├── abrir.bat                   Atalho Windows
│   ├── iniciar.js                  Sobe o servidor e abre o navegador
│   └── pet/                        ← Módulo de gamificação (novo)
│       ├── routes.js               Endpoints /api/pet/*
│       ├── engine.js               Regras de XP, streak, fome, check-in
│       ├── modifiers.js            Strategy Pattern dos equipamentos
│       └── seed.js                 Catálogo de itens e missões
│
├── frontend/                       Tudo que o navegador consome
│   ├── index.html                  Login / cadastro
│   ├── landing.html                Apresentação pública
│   ├── assets/                     Recursos compartilhados
│   │   ├── css/
│   │   │   ├── auth.css
│   │   │   ├── admin-access.css
│   │   │   ├── data-states.css     Estados de "carregando", "vazio", "erro"
│   │   │   └── motion.css
│   │   ├── js/
│   │   │   ├── account-session.js  Sessão do usuário, isolamento por conta
│   │   │   ├── auth.js             Lógica do login/cadastro
│   │   │   ├── auth-data.js
│   │   │   ├── data-source.js      Wrapper de fetch + helpers de tabela/CSV
│   │   │   ├── public-records.js   Carrega catálogo público
│   │   │   ├── landing.js
│   │   │   └── admin-access.js
│   │   └── images/
│   ├── admin/                      Painel administrativo
│   │   ├── dashboard.html
│   │   ├── usuarios.html
│   │   ├── servicos.html
│   │   ├── relatorios.html
│   │   ├── css/admin.css
│   │   └── js/
│   │       ├── main.js             Tema, menu, dialog de logout
│   │       ├── records.js          Tabelas, filtros e exportação CSV
│   │       ├── pessoas.js          Cadastro de contas
│   │       └── catalogo.js         Cadastro de serviços
│   ├── cliente/                    Área do cliente
│   │   ├── index.html              Contém as views (inclui #view-pet)
│   │   ├── css/
│   │   │   ├── cliente.css
│   │   │   └── pet.css             Estilos do pet (novo)
│   │   └── js/
│   │       ├── cliente.js          Módulo principal (nav, perfil, pedidos)
│   │       ├── solicitacao.js
│   │       └── pet.js              Renderiza e delega ações do pet (novo)
│   ├── funcionario/                Área do funcionário
│   │   ├── funcionario-dashboard.html
│   │   ├── funcionario-servicos.html
│   │   ├── funcionario-pedidos.html
│   │   ├── funcionario-agenda.html
│   │   ├── css/funcionario.css
│   │   └── js/
│   │       ├── funcionario.js      Tema, tabs, modal de perfil, logout
│   │       └── employee-data.js    Pedidos e calendário
│   ├── publico/                    Páginas públicas
│   │   ├── home.html
│   │   ├── servicos.html
│   │   ├── institucional.html
│   │   ├── css/publico.css
│   │   └── js/publico.js
│   └── suporte/                    Central de ajuda
│       ├── index.html
│       ├── contato.html
│       ├── css/suporte.css
│       └── js/suporte.js
│
└── tests/                          Testes automatizados (Node --test)
    ├── account-session.test.js
    ├── db-migration.test.js
    └── registered-data.test.js
```

---

## 4. Onde está cada coisa que eu preciso mexer

Este é o **índice por intenção**. Encontre a tarefa que você quer fazer e vá direto ao arquivo.

### 4.1 Autenticação e sessão

| Preciso... | Mexa em... |
|---|---|
| Alterar login ou cadastro | `frontend/assets/js/auth.js` |
| Mudar validações de cadastro no servidor | `backend/server.js` (função `cadastrarConta`) |
| Mudar duração da sessão | `backend/auth.js` (constante `lifetime`) |
| Trocar o hash de senha | `backend/auth.js` (`hash` e `verify`) |
| Bloquear uma rota por perfil | `backend/server.js` (variáveis `adminOnly`, `session.perfil`) |

### 4.2 Área do cliente

| Preciso... | Mexa em... |
|---|---|
| Adicionar uma view nova | `frontend/cliente/index.html` (`<section class="view">`) + `frontend/cliente/js/cliente.js` (registrar no `Navigation.go`) |
| Alterar a lógica de perfil | `frontend/cliente/js/cliente.js` → objeto `Profile` |
| Alterar o modal de foto | `frontend/cliente/js/cliente.js` → objeto `Photo` |
| Alterar o modal de pedido | `frontend/cliente/js/solicitacao.js` |
| Alterar o pet | `frontend/cliente/js/pet.js` e `frontend/cliente/css/pet.css` |

### 4.3 Área do funcionário

| Preciso... | Mexa em... |
|---|---|
| Alterar a agenda | `frontend/funcionario/js/employee-data.js` → `calendar()` |
| Alterar a tabela de pedidos | `frontend/funcionario/js/employee-data.js` → `renderOrders()` |
| Mudar aceite de pedidos | `frontend/funcionario/js/employee-data.js` (handler `data-accept-order`) + `backend/server.js` (`/api/os/:id/aceitar`) |

### 4.4 Área administrativa

| Preciso... | Mexa em... |
|---|---|
| Adicionar um item no menu | `frontend/admin/*.html` (bloco `<aside class="sidebar">`) |
| Alterar tabelas e exportação | `frontend/admin/js/records.js` |
| Cadastrar serviços no painel | `frontend/admin/js/catalogo.js` |
| Cadastrar pessoas no painel | `frontend/admin/js/pessoas.js` |
| Alterar o resumo do dashboard | `frontend/admin/js/records.js` (variável `record-summary`) |

### 4.5 Backend / API

| Preciso... | Mexa em... |
|---|---|
| Adicionar um endpoint comum | `backend/server.js` (dentro do `http.createServer`) |
| Adicionar um endpoint do pet | `backend/pet/routes.js` |
| Alterar regra de XP, streak ou fome | `backend/pet/engine.js` |
| Adicionar um item novo (roupa, comida) | `backend/pet/seed.js` |
| Alterar efeito de um equipamento | `backend/pet/seed.js` (campo `efeito_json`) |
| Alterar o ranking | `backend/pet/routes.js` (endpoint `/api/pet/ranking`) |
| Alterar o schema do banco | `backend/db.js` (novas colunas passam por `ensureColumn`) |

### 4.6 Estilos

| Área | Arquivo principal | Tokens (cores, espaçamentos) |
|---|---|---|
| Login/cadastro | `assets/css/auth.css` | `:root` no topo |
| Admin | `admin/css/admin.css` | `:root` no topo |
| Cliente | `cliente/css/cliente.css` | `:root, [data-theme="light"]` |
| Pet | `cliente/css/pet.css` | Reaproveita os tokens do cliente |
| Funcionário | `funcionario/css/funcionario.css` | `:root` no topo |
| Público | `publico/css/publico.css` | `:root` no topo |
| Suporte | `suporte/css/suporte.css` | `:root` no topo |

> **Regra geral**: um CSS por área, todos derivados do mesmo par de tokens `light`/`dark` (definidos em `:root` e `[data-theme="dark"]`). Se for adicionar cor nova, adicione **nos dois blocos** para o tema escuro continuar funcionando.

---

## 5. Como as regras funcionam

### 5.1 Sessão e perfis

O servidor emite um cookie **`dafix_sid`** (HttpOnly, SameSite=Strict) após login. O cliente guarda também uma cópia pública da sessão em `localStorage` (`dafix_session`) para o frontend saber quem está logado sem bater no backend a cada clique.

Cada conta tem acesso isolado: **`account-session.js`** gera chaves por `perfil:id` (por exemplo, `dafix_account:cliente:1:profile`). Isso impede que dois usuários no mesmo navegador vejam os dados um do outro.

Rotas administrativas e o próprio painel são protegidos **no backend** (`session.perfil === 'admin'`), não no frontend. Ocultar o botão no HTML não é segurança.

### 5.2 Pedidos e aceite

Fluxo de um pedido:

1. Cliente clica em **Solicitar serviço** (`POST /api/solicitacoes`). O servidor **busca o preço no banco** — nunca confia no valor enviado pelo navegador.
2. O pedido nasce com `id_funcionario = NULL` (aguardando aceite).
3. Funcionários veem o pedido em **Pedidos disponíveis** e clicam em **Aceitar** (`POST /api/os/:id/aceitar`).
4. O servidor executa `UPDATE ... WHERE id = ? AND id_funcionario IS NULL` — quem chegar primeiro leva.
5. Depois do aceite, o pedido aparece no painel e na agenda do profissional.

### 5.3 Gamificação (Pet / Streak)

Todas as regras vivem em **`backend/pet/engine.js`** e são aplicadas no servidor. O frontend só **desenha** o estado e dispara ações — nunca decide regra.

**Streak ("foguinho")**

- O usuário faz **check-in** uma vez por dia (`POST /api/pet/checkin`).
- O check-in compara `ultimo_checkin` com o **dia de hoje em São Paulo** (`hojeSP()`).
  - Se já fez hoje → retorna `jaFeito: true`, não muda nada.
  - Se fez ontem → soma 1 ao streak.
  - Se tem **congelamento** disponível e o streak atual ≥ 3 → consome 1 congelamento e **mantém** o streak.
  - Se passaram dois dias ou mais sem congelamento → streak volta para 1.

**Pet (XP e atributos)**

- Fome, felicidade, XP e moedas vivem na tabela `pet`.
- A **fome decai** 2 pontos por hora desde `ultima_atualizacao`. Cada 4 pontos de fome perdidos também custam 1 ponto de felicidade.
- O **pijama** multiplica o decaimento por 0,5. Isso é resolvido no `modifiers.js`, não em um `if` no engine.
- Alimentar consome **1 ração do inventário** e concede XP conforme a raridade (comum = 10 XP, rara = 25, lendária = 50).
- **Admin não consome ração**: a regra é checada no backend (`engine.comidaInfinita`). O frontend só mostra o botão ativo — quem impede o consumo é o servidor.

**Equipamentos (Strategy Pattern)**

Cada roupa ou acessório tem um `efeito_json` no banco:

```json
{
  "decaimento_fome":    { "operacao": "multiplicar", "valor": 0.5 },
  "chance_comida_rara": { "operacao": "somar",       "valor": 0.10 },
  "bonus_xp":           { "operacao": "multiplicar", "valor": 1.5 }
}
```

O `modifiers.js` compila cada efeito em uma função pura e aplica sobre o **contexto base**. Adicionar uma roupa nova = inserir uma linha em `pet_item_def` (via `seed.js`) **sem tocar no engine**. Não existe `if (temPijama) ... else if (temDetetive) ...`.

**Missões**

Cada missão (`pet_missao_def`) tem tipo `diaria` ou `premium`, e recompensas em moedas, XP e item de comida. O endpoint `POST /api/pet/missoes/concluir` valida:

- se a missão existe;
- se o usuário é premium (para missões premium);
- se **já não concluiu hoje** (`pet_missao_concluida`);
- verificações específicas por `slug` (por exemplo, `checkin_diario` exige que o check-in do dia já tenha sido feito).

**Ranking**

O endpoint `/api/pet/ranking` executa:

```sql
SELECT ... FROM pet
ORDER BY nivel DESC, streak_atual DESC, xp DESC
LIMIT 100
```

E existe um índice dedicado em `db.js`:

```sql
CREATE INDEX IF NOT EXISTS idx_pet_ranking
  ON pet(nivel DESC, streak_atual DESC, xp DESC)
```

Isso evita full scan quando o volume crescer.

### 5.4 Admin, Premium e as travas de segurança

| Regra | Onde é decidida | Como é aplicada |
|---|---|---|
| Só admin acessa painel | `backend/server.js` | `session.perfil === 'admin'` |
| Admin tem comida infinita | `backend/pet/engine.js` | `comidaInfinita(perfil)` antes de decrementar inventário |
| Premium compra cosméticos exclusivos | `backend/pet/routes.js` | `isPremium()` consulta `plano` na tabela `cliente`/`funcionario` |
| Premium conclui missões premium | `backend/pet/routes.js` | `missao.tipo === 'premium'` + `isPremium()` |
| Premium equipa itens exclusivos | `backend/pet/routes.js` | `item.premium_only` + `isPremium()` |

**Nunca** valide essas regras no frontend. O frontend só desabilita botões — o servidor é quem recusa a operação.

---

## 6. Banco de dados

O schema é criado em `backend/db.js` na primeira execução. Não há dados de demonstração: todas as listas começam vazias.

### 6.1 Tabelas principais

| Tabela | Para quê |
|---|---|
| `cliente`, `funcionario`, `admin` | Contas por perfil (senha com hash `scrypt$...`) |
| `servico` | Catálogo de serviços |
| `os` | Ordens de serviço (pedidos) |
| `pet` | Estado do pet por usuário |
| `pet_item_def` | Catálogo de itens (comida, roupa, acessório) |
| `pet_inventario` | O que cada pet possui |
| `pet_equipado` | O que cada pet veste (1 slot roupa + 1 slot acessório) |
| `pet_missao_def` | Catálogo de missões |
| `pet_missao_concluida` | Registro diário de missões concluídas |

### 6.2 Migrações

Toda mudança de schema precisa ser **idempotente** (rodar duas vezes tem que ser seguro). O projeto já usa esse padrão:

- `ensureColumn(tabela, coluna, ddl)` — adiciona uma coluna só se ela não existir. Foi o que criou `plano` em `cliente` e `funcionario`.
- Migração da `os` legada — reconstrói a tabela preservando pedidos antigos.

Sempre que adicionar uma coluna nova, **não** altere o `CREATE TABLE` esperando que o SQLite mude uma tabela existente — o SQLite não faz isso. Use `ensureColumn`.

### 6.3 Backup antes de mexer

Antes de qualquer migração em instalação real:

```bash
copy backend\banco.db backend\banco.backup.db
```

Ou, se preferir desistir e começar do zero: apague `backend/banco.db` e suba o servidor de novo (todas as contas serão recriadas do zero).

---

## 7. Como testar

### 7.1 Testes automatizados

Na raiz do projeto:

```bash
node --test tests/*.test.js
```

- `account-session.test.js` — sessão, isolamento por conta, logout.
- `registered-data.test.js` — cadastro, consultas e pedidos por conta (cria um banco temporário e apaga ao final).
- `db-migration.test.js` — migração da `os`.

Os testes **não alteram** o `backend/banco.db` real.

### 7.2 Testar o Pet/Streak manualmente

1. Cadastre um cliente em `http://localhost:5000/` e faça login.
2. Vá em **Meu Pet**.
3. Clique em **Fazer check-in**. O streak vai para 1.
4. Clique em **Alimentar**. O XP sobe, a fome cai.
5. Faça login como outro cliente em uma aba anônima e abra **Ranking** — os dois pets aparecem, ordenados por nível.

### 7.3 Testar o privilégio de Admin (comida infinita)

O pet é por conta: o privilégio do admin vale **para o pet do admin**, não para o dos outros.

1. Cadastre uma conta de cliente com seu e-mail.
2. No terminal (raiz do projeto):

   ```bash
   node backend/criar-admin.js seu-email@exemplo.com
   ```

3. Faça login em `/admin-login.html` com esse e-mail e a mesma senha do cliente.
4. Abra `/cliente/index.html` **nessa mesma sessão** (não é o painel de admin — é a área de cliente) e vá em **Meu Pet**.
5. Clique em **Alimentar** várias vezes seguidas. O pet alimenta **mesmo com o inventário vazio**.

Para comparar: faça o mesmo teste logado como **cliente comum**. A segunda vez que alimentar sem comprar ração, o servidor devolve `409 — Você não tem esse item no inventário`.

### 7.4 Testar o Premium

Existem três jeitos; escolha o mais confortável.

**Jeito A — SQL pelo VS Code**

1. Pare o servidor (Ctrl+C).
2. Instale a extensão **SQLite Viewer** no VS Code.
3. Abra `backend/banco.db`, entre na tabela `cliente`.
4. Altere o valor da coluna `plano` de `free` para `premium` na sua linha.
5. Salve, suba o servidor e recarregue a página.

**Jeito B — Extensão "SQLite" (alexcvzz) no VS Code**

1. `Ctrl+Shift+P` → **SQLite: Open Database** → escolha `backend/banco.db`.
2. `Ctrl+Shift+P` → **SQLite: New Query**.
3. Cole:

   ```sql
   UPDATE cliente SET plano = 'premium' WHERE email = 'seu@email.com';
   ```

4. `Ctrl+Shift+P` → **SQLite: Run Query**. Recarregue a página.

**Jeito C — Script pronto**

Na raiz do projeto, rode:

```bash
node backend/tornar-premium.js seu@email.com
```

Saída esperada:

```
✅ Conta seu@email.com agora é premium na tabela cliente.
```

**Como saber que funcionou**: na aba **Pet Shop**, os itens que antes mostravam botão **"Premium"** cinza passam a mostrar **"Comprar"**. A missão **"Elegância Corporativa"** deixa de aparecer bloqueada.

Para reverter, troque `'premium'` de volta para `'free'` (ou rode o script apontando para outro e-mail).

---

## 8. Rotas da API

Todas as rotas retornam JSON. Erros no formato `{ "erro": "mensagem" }`.

### 8.1 Autenticação

| Método | Rota | Precisa login | Descrição |
|---|---|---|---|
| POST | `/api/login` | Não | Login (corpo: `{ perfil, email, senha }`) |
| POST | `/api/logout` | Sim | Encerra a sessão |
| GET | `/api/session` | Não | Retorna a sessão atual ou 401 |

### 8.2 Cadastro por perfil

| Método | Rota | Precisa login | Descrição |
|---|---|---|---|
| POST | `/api/clientes` | Não | Cadastra cliente |
| POST | `/api/funcionarios` | Não | Cadastra funcionário |
| POST | `/api/admins` | **Admin** | Cadastra admin |

### 8.3 Catálogo e pedidos

| Método | Rota | Precisa login | Descrição |
|---|---|---|---|
| GET | `/api/servicos` | Não | Lista o catálogo |
| POST | `/api/servicos` | **Admin** | Cria serviço |
| POST | `/api/solicitacoes` | **Cliente** | Cria pedido (preço lido do banco) |
| POST | `/api/os/:id/aceitar` | **Funcionário** | Aceita pedido (atômico) |
| GET | `/api/os` | Sim | Lista pedidos visíveis ao perfil |

### 8.4 Pet / Streak

| Método | Rota | Precisa login | Descrição |
|---|---|---|---|
| GET | `/api/pet` | Sim | Estado do pet, equipamentos, inventário, missões |
| POST | `/api/pet/checkin` | Sim | Faz check-in do dia |
| POST | `/api/pet/alimentar` | Sim | Alimenta (corpo opcional: `{ item_id }`) |
| POST | `/api/pet/equipar` | Sim | Equipa item (`{ item_id }`) |
| POST | `/api/pet/desequipar` | Sim | Remove item (`{ slot: "roupa"|"acessorio" }`) |
| GET | `/api/pet/loja` | Sim | Lista itens à venda |
| POST | `/api/pet/comprar` | Sim | Compra item (`{ item_id }`) |
| POST | `/api/pet/missoes/concluir` | Sim | Conclui missão (`{ slug }`) |
| GET | `/api/pet/ranking` | Sim | Top 100 por nível e streak |

---

## 9. Scripts de linha de comando

Todos rodam na raiz do projeto (a pasta que tem `README.md`).

| Script | Para quê | Exemplo |
|---|---|---|
| `backend/criar-admin.js` | Promove uma conta de cliente a admin | `node backend/criar-admin.js seu@email.com` |
| `backend/tornar-premium.js` | Marca uma conta como premium | `node backend/tornar-premium.js seu@email.com` |

> **Atenção ao caminho**: se você já estiver **dentro** da pasta `backend`, use só o nome do arquivo:
>
> ```bash
> node tornar-premium.js seu@email.com
> ```
>
> Rodar `node backend/tornar-premium.js` de dentro de `backend/` vai procurar `backend/backend/tornar-premium.js` e falhar.

---

## 10. Segurança

| Camada | O que é feito |
|---|---|
| Senha | `scrypt` com salt por usuário (`backend/auth.js`); nunca em texto puro |
| Sessão | Cookie HttpOnly + SameSite=Strict; expira em 12h |
| SQL | Sempre com parâmetros `?` — nunca concatenar entrada do usuário |
| Upload de foto | Limitado a 5 MB e tipos `image/png`, `image/jpeg`, `image/webp` |
| Regras de negócio | Validadas no backend, nunca no frontend |
| Admin / Premium | Checagem no servidor (`session.perfil`, `plano`) |
| CORS | Origem não permitida é bloqueada (`403`) em métodos que mudam estado |

Para publicar fora do computador local, sirva o site por **HTTPS** — o cookie usa `Secure` automaticamente quando o servidor está atrás de TLS.

---

## 11. O que este projeto **não** faz

Documentar o que não existe é tão importante quanto documentar o que existe:

- **Não processa pagamentos** — o campo `preco_unitario` é apenas registro.
- **Não envia e-mail** — a recuperação de senha é apenas abertura de modal, sem envio real.
- **Não verifica conflito de agenda** — a data do pedido é uma preferência, não uma reserva.
- **Não tem serviço de notificações push** — os "badges" de notificação no topo não são dinâmicos.
- **Não tem gateway para conectar ao GitHub** — se você quiser publicar, o passo a passo está abaixo.

---

## 12. Como publicar no GitHub

O repositório deve conter **código**, não **dados**. O `.gitignore` já cuida disso.

### 12.1 Primeira publicação

```bash
# Na raiz do projeto
git init
git add .
git status          # confira que node_modules/ e banco.db NÃO aparecem
git commit -m "Primeiro commit"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/dafix.git
git push -u origin main
```

Se o `git push` pedir "senha", o GitHub exige um **Personal Access Token (PAT)**:

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**.
2. **Generate new token** → marque `repo` → **Generate**.
3. Copie o token (`ghp_...`) e use no lugar da senha.

### 12.2 Commits seguintes

```bash
git add .
git commit -m "Descrição curta do que mudou"
git push
```

### 12.3 Se o `.gitignore` foi criado depois de um push acidental

Se você já enviou `node_modules/` ou `banco.db` sem querer:

```bash
git rm -r --cached backend/node_modules backend/banco.db
git commit -m "Remove node_modules e banco.db do controle de versão"
git push
```

Os arquivos continuam no seu disco — só param de ser rastreados.

---

## 13. Checklist de verificação

Antes de abrir um PR, tirar dúvida ou publicar algo:

- [ ] `npm ci --prefix backend` roda sem erro.
- [ ] `node backend/server.js` sobe na porta 5000.
- [ ] Cadastro e login funcionam nos dois perfis (cliente e funcionário).
- [ ] O painel de admin responde em `/admin-login.html` depois de `criar-admin.js`.
- [ ] A aba **Meu Pet** carrega sem erro no console.
- [ ] Check-in, alimentar, comprar e equipar funcionam.
- [ ] Os testes passam: `node --test tests/*.test.js`.
- [ ] `git status` não mostra `node_modules/` nem `banco.db`.
- [ ] O `README.md` continua correspondendo à realidade do código.

---

## 14. Referência rápida — "onde mexo para..."

Tabela final para o dia a dia:

| Se eu quiser... | Vou em... |
|---|---|
| Mudar a cor principal do site | `assets/css/auth.css` (bloco `:root`) — é a fonte dos tokens |
| Adicionar uma coluna em `cliente` | `backend/db.js` (via `ensureColumn`) |
| Criar uma view nova na área do cliente | `cliente/index.html` + `cliente/js/cliente.js` |
| Adicionar um item ao Pet Shop | `backend/pet/seed.js` (array `ITENS`) |
| Criar uma missão nova | `backend/pet/seed.js` (array `MISSOES`) |
| Alterar a fórmula de XP | `backend/pet/engine.js` (`xpParaProximoNivel`) |
| Alterar o decaimento da fome | `backend/pet/engine.js` (`DECAY_PONTOS_POR_HORA`) |
| Alterar o critério do ranking | `backend/pet/routes.js` (`ORDER BY`) + `backend/db.js` (índice) |
| Trocar o efeito de uma roupa | `backend/pet/seed.js` (`efeito_json` do item) |
| Adicionar uma operação de modificador nova | `backend/pet/modifiers.js` (objeto `OPERACOES`) |
| Ver a lista de endpoints | Seção 8 deste README |

---

*Este README foi pensado para servir como mapa. Se um comportamento do código divergir do que está escrito aqui, a divergência é um bug — trate-a como tal.*
