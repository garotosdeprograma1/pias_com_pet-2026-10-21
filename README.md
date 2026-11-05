# pias_com_pet-2026-10-21

🩹 Causa
O db.js (linha 61) está tentando ler gamificacao_schema.sql com fs.readFileSync, mas o arquivo não existe na pasta backend/. Eu passei o conteúdo no chat mas não deixei explícito que você precisava criar o arquivo físico antes de rodar.

Tem duas saídas. A Opção A é a mais robusta — elimina a dependência de arquivo externo e funciona mesmo se a pasta for movida.

✅ Opção A (recomendada) — SQL inline no db.js
Substitua o seu backend/db.js inteiro por este:

javascript
// =====================================================
// DAFIX · db.js — conexão SQLite + schema + seeds
// =====================================================
var sqlite3 = require('sqlite3');
var path = require('path');

var caminho = path.join(__dirname, 'banco.db');
var db = new sqlite3.Database(caminho);

// -----------------------------------------------------------------
// Schema base (tabelas originais do projeto)
// -----------------------------------------------------------------
var SQL_BASE = `
  CREATE TABLE IF NOT EXISTS cliente (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    nome     TEXT NOT NULL,
    cpf      TEXT NOT NULL UNIQUE,
    email    TEXT NOT NULL UNIQUE,
    telefone TEXT NOT NULL,
    senha    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS funcionario (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    nome          TEXT NOT NULL,
    cpf           TEXT NOT NULL UNIQUE,
    email         TEXT NOT NULL UNIQUE,
    telefone      TEXT NOT NULL,
    senha         TEXT NOT NULL,
    especialidade TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS servico (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    nome_servico TEXT NOT NULL,
    descricao    TEXT,
    preco_base   REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS os (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente     INTEGER NOT NULL,
    id_servico     INTEGER NOT NULL,
    id_funcionario INTEGER NOT NULL,
    preco_unitario REAL NOT NULL,
    data           TEXT NOT NULL,
    local          TEXT NOT NULL,
    descricao      TEXT NOT NULL,
    FOREIGN KEY (id_cliente)     REFERENCES cliente(id)     ON DELETE CASCADE,
    FOREIGN KEY (id_servico)     REFERENCES servico(id),
    FOREIGN KEY (id_funcionario) REFERENCES funcionario(id)
  );
`;

// -----------------------------------------------------------------
// Schema de gamificação
// -----------------------------------------------------------------
var SQL_GAMIFICACAO = `
  CREATE TABLE IF NOT EXISTS gamificacao_perfil (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente        INTEGER NOT NULL UNIQUE,
    streak_atual      INTEGER NOT NULL DEFAULT 0,
    streak_recorde    INTEGER NOT NULL DEFAULT 0,
    ultima_interacao  TEXT,
    congelamentos     INTEGER NOT NULL DEFAULT 1,
    pet_nome          TEXT    NOT NULL DEFAULT 'Dafixinho',
    pet_nivel         INTEGER NOT NULL DEFAULT 1,
    pet_xp            INTEGER NOT NULL DEFAULT 0,
    pet_fome          INTEGER NOT NULL DEFAULT 100,
    pet_felicidade    INTEGER NOT NULL DEFAULT 100,
    moedas            INTEGER NOT NULL DEFAULT 50,
    criado_em         TEXT    NOT NULL DEFAULT (datetime('now')),
    atualizado_em     TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gamificacao_item (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    slug          TEXT    NOT NULL UNIQUE,
    nome          TEXT    NOT NULL,
    descricao     TEXT,
    slot          TEXT    NOT NULL,
    raridade      TEXT    NOT NULL DEFAULT 'comum',
    preco_moedas  INTEGER NOT NULL DEFAULT 100,
    premium_only  INTEGER NOT NULL DEFAULT 0,
    bonus_json    TEXT    NOT NULL DEFAULT '{}',
    emoji         TEXT    NOT NULL DEFAULT '👕'
  );

  CREATE TABLE IF NOT EXISTS gamificacao_inventario (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente    INTEGER NOT NULL,
    id_item       INTEGER NOT NULL,
    equipado      INTEGER NOT NULL DEFAULT 0,
    adquirido_em  TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE (id_cliente, id_item),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (id_item)    REFERENCES gamificacao_item(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS gamificacao_tarefa (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    slug              TEXT    NOT NULL UNIQUE,
    titulo            TEXT    NOT NULL,
    descricao         TEXT,
    tipo              TEXT    NOT NULL DEFAULT 'comum',
    recompensa_xp     INTEGER NOT NULL DEFAULT 10,
    recompensa_moedas INTEGER NOT NULL DEFAULT 5,
    cooldown_horas    INTEGER NOT NULL DEFAULT 24,
    ativa             INTEGER NOT NULL DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS gamificacao_tarefa_log (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    id_cliente    INTEGER NOT NULL,
    id_tarefa     INTEGER NOT NULL,
    concluida_em  TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE,
    FOREIGN KEY (id_tarefa)  REFERENCES gamificacao_tarefa(id)
  );

  CREATE TABLE IF NOT EXISTS sessao (
    sid             TEXT PRIMARY KEY,
    id_cliente      INTEGER,
    id_funcionario  INTEGER,
    perfil          TEXT NOT NULL CHECK (perfil IN ('cliente','funcionario','admin')),
    criada_em       TEXT NOT NULL DEFAULT (datetime('now')),
    expira_em       TEXT NOT NULL,
    FOREIGN KEY (id_cliente)     REFERENCES cliente(id)     ON DELETE CASCADE,
    FOREIGN KEY (id_funcionario) REFERENCES funcionario(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_gamif_streak  ON gamificacao_perfil(streak_atual DESC, pet_nivel DESC);
  CREATE INDEX IF NOT EXISTS idx_gamif_cliente ON gamificacao_perfil(id_cliente);
  CREATE INDEX IF NOT EXISTS idx_gamif_tarlog  ON gamificacao_tarefa_log(id_cliente, id_tarefa, concluida_em);
  CREATE INDEX IF NOT EXISTS idx_sessao_expira ON sessao(expira_em);
`;

// -----------------------------------------------------------------
// Seeds iniciais (idempotentes via INSERT OR IGNORE)
// -----------------------------------------------------------------
var SQL_SEEDS = `
  INSERT OR IGNORE INTO gamificacao_item
    (slug, nome, descricao, slot, raridade, preco_moedas, premium_only, bonus_json, emoji)
  VALUES
    ('chapeu_base',  'Boné Dafix',          'O básico de todo bom pet.',                                   'cabeca', 'comum',    0,   0, '{}',                                         '🧢'),
    ('detetive',     'Roupa de Detetive',   'Aumenta a chance de achar comida rara.',                      'corpo',  'raro',     200, 0, '{"drop_raro":0.10}',                         '🕵️'),
    ('pijama',       'Pijama Confortável',  'O pet fica mais tranquilo e a fome cresce menos.',            'corpo',  'raro',     180, 0, '{"fome_rate":-0.20}',                        '🛌'),
    ('uniforme_pro', 'Uniforme Premium',    'Bônus de XP em tarefas (só funcionários/assinantes).',        'corpo',  'epico',    500, 1, '{"xp_bonus":0.15,"felicidade_rate":0.10}',   '🎩'),
    ('oculos_sol',   'Óculos de Sol',       'Aumenta a felicidade do pet.',                                'cabeca', 'comum',    120, 0, '{"felicidade_bonus":5}',                     '🕶️'),
    ('coroa',        'Coroa Dourada',       'Item de prestígio. Não altera stats.',                        'cabeca', 'lendario', 900, 1, '{}',                                         '👑');

  INSERT OR IGNORE INTO gamificacao_tarefa
    (slug, titulo, descricao, tipo, recompensa_xp, recompensa_moedas, cooldown_horas)
  VALUES
    ('checkin',        'Check-in diário',   'Abra o app uma vez por dia.',                 'comum',   10,  5,  24),
    ('criar_pedido',   'Fazer um pedido',   'Solicite qualquer serviço na plataforma.',    'comum',   25, 15,  24),
    ('avaliar',        'Avaliar um serviço','Envie uma avaliação para um profissional.',   'comum',   20, 10,  24),
    ('perfil_ok',      'Perfil completo',   'Preencha nome, telefone e endereço.',         'comum',   15,  8, 720),
    ('missao_premium', 'Missão Premium',    'Assinantes: tarefa exclusiva diária.',        'premium', 50, 30,  24);
`;

// -----------------------------------------------------------------
// Execução sequencial
// -----------------------------------------------------------------
db.serialize(function () {
  db.run('PRAGMA foreign_keys = ON');

  db.exec(SQL_BASE, function (err) {
    if (err) return console.error('[db] schema base:', err.message);
    console.log('[db] schema base ok');

    db.exec(SQL_GAMIFICACAO, function (err2) {
      if (err2) return console.error('[db] schema gamificação:', err2.message);
      console.log('[db] schema gamificação ok');

      db.exec(SQL_SEEDS, function (err3) {
        if (err3) return console.error('[db] seeds:', err3.message);
        else console.log('[db] seeds ok');
      });
    });
  });
});

module.exports = db;
Vantagens:

Sem fs.readFileSync, sem caminho relativo, sem ENOENT.

Funciona se você mover a pasta, renomear, zipar, etc.

Versão do schema fica acoplada ao código (bom para o TCC).

Rode node server.js de novo — deve imprimir:

text
[db] schema base ok
[db] schema gamificação ok
[db] seeds ok
🔧 Opção B — Criar o arquivo gamificacao_schema.sql
Se você prefere manter o arquivo separado (mais "organizado" visualmente), crie backend/gamificacao_schema.sql com este conteúdo:

sql
-- ==========================================================
-- DAFIX · Gamificação (Streak + Virtual Pet) + Sessões
-- ==========================================================

CREATE TABLE IF NOT EXISTS gamificacao_perfil (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente        INTEGER NOT NULL UNIQUE,
  streak_atual      INTEGER NOT NULL DEFAULT 0,
  streak_recorde    INTEGER NOT NULL DEFAULT 0,
  ultima_interacao  TEXT,
  congelamentos     INTEGER NOT NULL DEFAULT 1,
  pet_nome          TEXT    NOT NULL DEFAULT 'Dafixinho',
  pet_nivel         INTEGER NOT NULL DEFAULT 1,
  pet_xp            INTEGER NOT NULL DEFAULT 0,
  pet_fome          INTEGER NOT NULL DEFAULT 100,
  pet_felicidade    INTEGER NOT NULL DEFAULT 100,
  moedas            INTEGER NOT NULL DEFAULT 50,
  criado_em         TEXT    NOT NULL DEFAULT (datetime('now')),
  atualizado_em     TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gamificacao_item (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  slug          TEXT    NOT NULL UNIQUE,
  nome          TEXT    NOT NULL,
  descricao     TEXT,
  slot          TEXT    NOT NULL,
  raridade      TEXT    NOT NULL DEFAULT 'comum',
  preco_moedas  INTEGER NOT NULL DEFAULT 100,
  premium_only  INTEGER NOT NULL DEFAULT 0,
  bonus_json    TEXT    NOT NULL DEFAULT '{}',
  emoji         TEXT    NOT NULL DEFAULT '👕'
);

CREATE TABLE IF NOT EXISTS gamificacao_inventario (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente    INTEGER NOT NULL,
  id_item       INTEGER NOT NULL,
  equipado      INTEGER NOT NULL DEFAULT 0,
  adquirido_em  TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (id_cliente, id_item),
  FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE,
  FOREIGN KEY (id_item)    REFERENCES gamificacao_item(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS gamificacao_tarefa (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT    NOT NULL UNIQUE,
  titulo            TEXT    NOT NULL,
  descricao         TEXT,
  tipo              TEXT    NOT NULL DEFAULT 'comum',
  recompensa_xp     INTEGER NOT NULL DEFAULT 10,
  recompensa_moedas INTEGER NOT NULL DEFAULT 5,
  cooldown_horas    INTEGER NOT NULL DEFAULT 24,
  ativa             INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS gamificacao_tarefa_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente    INTEGER NOT NULL,
  id_tarefa     INTEGER NOT NULL,
  concluida_em  TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE,
  FOREIGN KEY (id_tarefa)  REFERENCES gamificacao_tarefa(id)
);

CREATE TABLE IF NOT EXISTS sessao (
  sid             TEXT PRIMARY KEY,
  id_cliente      INTEGER,
  id_funcionario  INTEGER,
  perfil          TEXT NOT NULL CHECK (perfil IN ('cliente','funcionario','admin')),
  criada_em       TEXT NOT NULL DEFAULT (datetime('now')),
  expira_em       TEXT NOT NULL,
  FOREIGN KEY (id_cliente)     REFERENCES cliente(id)     ON DELETE CASCADE,
  FOREIGN KEY (id_funcionario) REFERENCES funcionario(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_gamif_streak  ON gamificacao_perfil(streak_atual DESC, pet_nivel DESC);
CREATE INDEX IF NOT EXISTS idx_gamif_cliente ON gamificacao_perfil(id_cliente);
CREATE INDEX IF NOT EXISTS idx_gamif_tarlog  ON gamificacao_tarefa_log(id_cliente, id_tarefa, concluida_em);
CREATE INDEX IF NOT EXISTS idx_sessao_expira ON sessao(expira_em);

INSERT OR IGNORE INTO gamificacao_item
  (slug, nome, descricao, slot, raridade, preco_moedas, premium_only, bonus_json, emoji)
VALUES
  ('chapeu_base',  'Boné Dafix',          'O básico de todo bom pet.',                         'cabeca', 'comum',    0,   0, '{}',                                       '🧢'),
  ('detetive',     'Roupa de Detetive',   'Aumenta a chance de achar comida rara.',            'corpo',  'raro',     200, 0, '{"drop_raro":0.10}',                       '🕵️'),
  ('pijama',       'Pijama Confortável',  'O pet fica mais tranquilo e a fome cresce menos.',  'corpo',  'raro',     180, 0, '{"fome_rate":-0.20}',                      '🛌'),
  ('uniforme_pro', 'Uniforme Premium',    'Bônus de XP em tarefas.',                            'corpo',  'epico',    500, 1, '{"xp_bonus":0.15,"felicidade_rate":0.10}', '🎩'),
  ('oculos_sol',   'Óculos de Sol',       'Aumenta a felicidade do pet.',                       'cabeca', 'comum',    120, 0, '{"felicidade_bonus":5}',                   '🕶️'),
  ('coroa',        'Coroa Dourada',       'Item de prestígio.',                                 'cabeca', 'lendario', 900, 1, '{}',                                       '👑');

INSERT OR IGNORE INTO gamificacao_tarefa
  (slug, titulo, descricao, tipo, recompensa_xp, recompensa_moedas, cooldown_horas)
VALUES
  ('checkin',        'Check-in diário',    'Abra o app uma vez por dia.',                'comum',   10,  5,  24),
  ('criar_pedido',   'Fazer um pedido',    'Solicite qualquer serviço na plataforma.',   'comum',   25, 15,  24),
  ('avaliar',        'Avaliar um serviço', 'Envie uma avaliação para um profissional.',  'comum',   20, 10,  24),
  ('perfil_ok',      'Perfil completo',    'Preencha nome, telefone e endereço.',        'comum',   15,  8, 720),
  ('missao_premium', 'Missão Premium',     'Assinantes: tarefa exclusiva diária.',       'premium', 50, 30,  24);
E mantenha no db.js a linha que você já adicionou:

javascript
db.exec(require('fs').readFileSync(__dirname + '/gamificacao_schema.sql', 'utf8'), (err) => {
  if (err) console.error('Schema de gamificação:', err.message);
});
🧹 Se o banco.db estiver "sujo" de tentativas anteriores
Se você já rodou antes e criou tabelas pela metade, apague o arquivo backend/banco.db uma vez e rode de novo (o db.js recria tudo via CREATE TABLE IF NOT EXISTS + INSERT OR IGNORE):

bash
# Windows (PowerShell)
Remove-Item .\backend\banco.db

# ou cmd
del backend\banco.db
Se o banco tiver dados que você quer preservar, não apague — os IF NOT EXISTS e INSERT OR IGNORE já garantem idempotência.

✅ Verificação rápida
Depois de aplicar a Opção A, rode:

bash
node server.js
Deve mostrar:

text
[db] schema base ok
[db] schema gamificação ok
[db] seeds ok
[cron] gamificação ativa (tick 1h).

  Pronto! Gravando em banco.db (SQLite).
      http://localhost:5000
Para conferir que as tabelas existem, abra outro terminal:

bash
# Windows
sqlite3 backend\banco.db ".tables"
Deve listar: cliente funcionario gamificacao_inventario gamificacao_item gamificacao_perfil gamificacao_tarefa gamificacao_tarefa_log os servico sessao.

Se sqlite3 não estiver instalado, use o próprio Node:

bash
node -e "const db=require('./backend/db');db.all(\"SELECT name FROM sqlite_master WHERE type='table' ORDER BY name\",(e,r)=>console.log(r));"
