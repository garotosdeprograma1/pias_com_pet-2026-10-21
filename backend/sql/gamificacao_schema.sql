-- ==========================================================
-- DAFIX · GAMIFICAÇÃO (Streak + Virtual Pet)
-- ==========================================================

-- Perfil de gamificação do cliente
CREATE TABLE IF NOT EXISTS gamificacao_perfil (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente            INTEGER NOT NULL UNIQUE,
  -- Streak
  streak_atual          INTEGER NOT NULL DEFAULT 0,
  streak_recorde        INTEGER NOT NULL DEFAULT 0,
  ultima_interacao      TEXT,     -- ISO 8601
  congelamentos         INTEGER NOT NULL DEFAULT 1,
  -- Pet
  pet_nome              TEXT    NOT NULL DEFAULT 'Dafixinho',
  pet_nivel             INTEGER NOT NULL DEFAULT 1,
  pet_xp                INTEGER NOT NULL DEFAULT 0,
  pet_fome              INTEGER NOT NULL DEFAULT 100,   -- 0..100
  pet_felicidade        INTEGER NOT NULL DEFAULT 100,   -- 0..100
  moedas                INTEGER NOT NULL DEFAULT 50,
  -- Meta
  criado_em             TEXT    NOT NULL DEFAULT (datetime('now')),
  atualizado_em         TEXT    NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (id_cliente) REFERENCES cliente(id) ON DELETE CASCADE
);

-- Catálogo de itens (roupas / acessórios / cosméticos)
CREATE TABLE IF NOT EXISTS gamificacao_item (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  slug              TEXT    NOT NULL UNIQUE,        -- ex: 'detetive'
  nome              TEXT    NOT NULL,
  descricao         TEXT,
  slot              TEXT    NOT NULL,               -- 'corpo' | 'cabeca' | 'acessorio'
  raridade          TEXT    NOT NULL DEFAULT 'comum', -- comum|raro|epico|lendario
  preco_moedas      INTEGER NOT NULL DEFAULT 100,
  premium_only      INTEGER NOT NULL DEFAULT 0,     -- 0=livre, 1=assinante
  bonus_json        TEXT    NOT NULL DEFAULT '{}',  -- {"drop_raro":0.10,"fome_rate":-0.20,...}
  emoji             TEXT    NOT NULL DEFAULT '👕'
);

-- Inventário do cliente
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

-- Catálogo de tarefas/missões
CREATE TABLE IF NOT EXISTS gamificacao_tarefa (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  slug             TEXT    NOT NULL UNIQUE,
  titulo           TEXT    NOT NULL,
  descricao        TEXT,
  tipo             TEXT    NOT NULL DEFAULT 'comum',  -- comum | premium
  recompensa_xp    INTEGER NOT NULL DEFAULT 10,
  recompensa_moedas INTEGER NOT NULL DEFAULT 5,
  cooldown_horas   INTEGER NOT NULL DEFAULT 24,       -- tempo mínimo entre repetições
  ativa            INTEGER NOT NULL DEFAULT 1
);

-- Progresso de tarefas por cliente
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
  FOREIGN KEY (id_cliente)     REFERENCES cliente(id) ON DELETE CASCADE,
  FOREIGN KEY (id_funcionario) REFERENCES funcionario(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessao_expira ON sessao(expira_em);
CREATE INDEX IF NOT EXISTS idx_gamif_streak  ON gamificacao_perfil(streak_atual DESC, pet_nivel DESC);
CREATE INDEX IF NOT EXISTS idx_gamif_cliente ON gamificacao_perfil(id_cliente);
CREATE INDEX IF NOT EXISTS idx_gamif_tarlog  ON gamificacao_tarefa_log(id_cliente, id_tarefa, concluida_em);

-- Seed: itens iniciais
INSERT OR IGNORE INTO gamificacao_item (slug, nome, descricao, slot, raridade, preco_moedas, premium_only, bonus_json, emoji) VALUES
  ('chapeu_base',    'Boné Dafix',        'O básico de todo bom pet.',              'cabeca', 'comum',    0,   0, '{}',                                             '🧢'),
  ('detetive',       'Roupa de Detetive', 'Aumenta a chance de achar comida rara.', 'corpo',  'raro',     200, 0, '{"drop_raro":0.10}',                             '🕵️'),
  ('pijama',         'Pijama Confortável', 'O pet fica mais tranquilo e a fome cresce menos.', 'corpo', 'raro', 180, 0, '{"fome_rate":-0.20}',                        '🛌'),
  ('uniforme_pro',   'Uniforme Premium',  'Bônus de XP em tarefas (só funcionários/assinantes).', 'corpo', 'epico', 500, 1, '{"xp_bonus":0.15,"felicidade_rate":0.10}', '🎩'),
  ('oculos_sol',     'Óculos de Sol',     'Aumenta a felicidade do pet.',           'cabeca', 'comum',   120, 0, '{"felicidade_bonus":5}',                        '🕶️'),
  ('coroa',          'Coroa Dourada',     'Item de prestígio. Não altera stats.',   'cabeca', 'lendario', 900, 1, '{}',                                             '👑');

-- Seed: tarefas
INSERT OR IGNORE INTO gamificacao_tarefa (slug, titulo, descricao, tipo, recompensa_xp, recompensa_moedas, cooldown_horas) VALUES
  ('checkin',       'Check-in diário',      'Abra o app uma vez por dia.',              'comum',   10,  5,  24),
  ('criar_pedido',  'Fazer um pedido',      'Solicite qualquer serviço na plataforma.', 'comum',   25, 15,  24),
  ('avaliar',       'Avaliar um serviço',   'Envie uma avaliação para um profissional.', 'comum',  20, 10,  24),
  ('perfil_ok',     'Perfil completo',      'Preencha nome, telefone e endereço.',      'comum',   15,  8, 720),
  ('missao_premium','Missão Premium',       'Assinantes: tarefa exclusiva diária.',     'premium', 50, 30,  24);