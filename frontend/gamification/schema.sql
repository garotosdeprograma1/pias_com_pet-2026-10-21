-- =====================================================
-- DaFix Pets · Schema v2 (5 slots + triggers + funções)
-- =====================================================

-- ========== USERS ==========
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS gamification_opted_out BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) CHECK (role IN ('cliente','funcionario','admin')) DEFAULT 'cliente';

-- ========== PETS ==========
CREATE TABLE IF NOT EXISTS pets (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name            VARCHAR(40) NOT NULL DEFAULT 'Faísca',
  species         VARCHAR(30) NOT NULL DEFAULT 'dafix_default',
  level           INTEGER NOT NULL DEFAULT 1,
  xp              INTEGER NOT NULL DEFAULT 0,
  hunger          SMALLINT NOT NULL DEFAULT 100 CHECK (hunger BETWEEN 0 AND 100),
  skin            VARCHAR(40) DEFAULT 'default_blue',
  equipped        JSONB NOT NULL DEFAULT '{"hat":null,"collar":null,"clothes":null,"background":null}'::jsonb,
  xp_boost_until  TIMESTAMPTZ,
  xp_boost_mult   NUMERIC(3,2) DEFAULT 1.00,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pets_level ON pets(level DESC, xp DESC);
CREATE INDEX IF NOT EXISTS idx_pets_equipped ON pets USING GIN (equipped);

-- ========== PET_FOOD_INVENTORY ==========
CREATE TABLE IF NOT EXISTS pet_food_inventory (
  pet_id          BIGINT PRIMARY KEY REFERENCES pets(id) ON DELETE CASCADE,
  quantity        INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  lifetime_earned INTEGER NOT NULL DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========== COSMETIC_ITEMS (com clothes + background) ==========
CREATE TABLE IF NOT EXISTS cosmetic_items (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(60) UNIQUE NOT NULL,
  name            VARCHAR(80) NOT NULL,
  slot            VARCHAR(20) NOT NULL CHECK (slot IN ('skin','hat','collar','clothes','background')),
  rarity          VARCHAR(10) NOT NULL CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  unlock_level    INTEGER NOT NULL DEFAULT 1,
  emoji           VARCHAR(8) NOT NULL,
  color           VARCHAR(16),
  asset_url       VARCHAR(255),
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ========== PET_INVENTORY ==========
CREATE TABLE IF NOT EXISTS pet_inventory (
  id              BIGSERIAL PRIMARY KEY,
  pet_id          BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  item_id         INTEGER NOT NULL REFERENCES cosmetic_items(id) ON DELETE CASCADE,
  acquired_at     TIMESTAMPTZ DEFAULT NOW(),
  source          VARCHAR(20) DEFAULT 'levelup' CHECK (source IN ('levelup','goal','leaderboard','admin','promo','onboarding')),
  UNIQUE (pet_id, item_id)
);

-- ========== DAILY_GOAL_DEFINITIONS ==========
CREATE TABLE IF NOT EXISTS daily_goal_definitions (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(40) UNIQUE NOT NULL,
  audience        VARCHAR(15) NOT NULL CHECK (audience IN ('cliente','funcionario')),
  title           VARCHAR(120) NOT NULL,
  description     TEXT,
  target_count    INTEGER NOT NULL DEFAULT 1,
  reward_food     INTEGER NOT NULL,
  reward_xp       INTEGER NOT NULL,
  is_active       BOOLEAN DEFAULT TRUE
);

-- ========== USER_GOAL_PROGRESS ==========
CREATE TABLE IF NOT EXISTS user_goal_progress (
  id              BIGSERIAL PRIMARY KEY,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id         INTEGER NOT NULL REFERENCES daily_goal_definitions(id),
  progress_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  current_count   INTEGER NOT NULL DEFAULT 0,
  target_count    INTEGER NOT NULL,
  is_completed    BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at    TIMESTAMPTZ,
  UNIQUE (user_id, goal_id, progress_date)
);
CREATE INDEX IF NOT EXISTS idx_goal_progress_date ON user_goal_progress(user_id, progress_date);

-- ========== GAMIFICATION_EVENTS ==========
CREATE TABLE IF NOT EXISTS gamification_events (
  id              BIGSERIAL PRIMARY KEY,
  event_id        UUID UNIQUE NOT NULL,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type      VARCHAR(40) NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  food_awarded    INTEGER DEFAULT 0,
  xp_awarded      INTEGER DEFAULT 0,
  source          VARCHAR(20) DEFAULT 'backend' CHECK (source IN ('backend','demo','admin','cron','onboarding')),
  processed_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gamif_user ON gamification_events(user_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_gamif_type ON gamification_events(event_type, processed_at DESC);

-- ========== BADGES + USER_BADGES ==========
CREATE TABLE IF NOT EXISTS badges (
  id              SERIAL PRIMARY KEY,
  slug            VARCHAR(40) UNIQUE NOT NULL,
  name            VARCHAR(80) NOT NULL,
  description     TEXT,
  emoji           VARCHAR(8),
  rarity          VARCHAR(10)
);
CREATE TABLE IF NOT EXISTS user_badges (
  user_id         BIGINT REFERENCES users(id) ON DELETE CASCADE,
  badge_id        INTEGER REFERENCES badges(id),
  awarded_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- ========== LEADERBOARD_SNAPSHOTS ==========
CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id              BIGSERIAL PRIMARY KEY,
  audience        VARCHAR(15) NOT NULL CHECK (audience IN ('cliente','funcionario')),
  period          VARCHAR(10) NOT NULL CHECK (period IN ('weekly','monthly','all_time')),
  period_key      VARCHAR(20) NOT NULL,
  user_id         BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score           NUMERIC(12,2) NOT NULL,
  rank_position   INTEGER NOT NULL,
  computed_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (audience, period, period_key, user_id)
);
CREATE INDEX IF NOT EXISTS idx_lb_lookup ON leaderboard_snapshots(audience, period, period_key, rank_position);

-- ========== PET_ACTIVITY_LOG ==========
CREATE TABLE IF NOT EXISTS pet_activity_log (
  id              BIGSERIAL PRIMARY KEY,
  pet_id          BIGINT NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  activity_date   DATE NOT NULL DEFAULT CURRENT_DATE,
  feeds_count     INTEGER NOT NULL DEFAULT 0,
  goals_completed INTEGER NOT NULL DEFAULT 0,
  xp_earned       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (pet_id, activity_date)
);

-- =====================================================
-- FUNÇÕES
-- =====================================================
CREATE OR REPLACE FUNCTION xp_for_level(n INTEGER) RETURNS INTEGER AS $$
  SELECT ROUND(100 * POWER(n::numeric, 1.6) + 50 * n)::INTEGER;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION total_xp_for_level(n INTEGER) RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(xp_for_level(i)), 0)::INTEGER FROM generate_series(1, n-1) AS i;
$$ LANGUAGE SQL IMMUTABLE;

CREATE OR REPLACE FUNCTION level_from_xp(total_xp INTEGER) RETURNS INTEGER AS $$
  SELECT COALESCE(MAX(lvl), 1) FROM generate_series(1, 100) AS lvl WHERE total_xp_for_level(lvl) <= total_xp;
$$ LANGUAGE SQL IMMUTABLE;

-- =====================================================
-- TRIGGERS
-- =====================================================
CREATE OR REPLACE FUNCTION trg_auto_unlock_cosmetics() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pet_inventory (pet_id, item_id, source)
  SELECT NEW.id, ci.id, 'levelup'
  FROM cosmetic_items ci
  WHERE ci.is_active = TRUE
    AND ci.unlock_level <= NEW.level
    AND NOT EXISTS (SELECT 1 FROM pet_inventory pi WHERE pi.pet_id = NEW.id AND pi.item_id = ci.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pets_auto_unlock ON pets;
CREATE TRIGGER pets_auto_unlock
AFTER UPDATE OF level ON pets
FOR EACH ROW
WHEN (NEW.level > OLD.level)
EXECUTE FUNCTION trg_auto_unlock_cosmetics();

CREATE OR REPLACE FUNCTION trg_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pets_set_updated_at ON pets;
CREATE TRIGGER pets_set_updated_at BEFORE UPDATE ON pets
FOR EACH ROW EXECUTE FUNCTION trg_set_updated_at();

-- Trigger: cria inventário inicial (kit onboarding) ao inserir pet
CREATE OR REPLACE FUNCTION trg_onboarding_kit() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pet_food_inventory (pet_id, quantity, lifetime_earned)
  VALUES (NEW.id, 10, 10)
  ON CONFLICT (pet_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pets_onboarding_kit ON pets;
CREATE TRIGGER pets_onboarding_kit
AFTER INSERT ON pets
FOR EACH ROW EXECUTE FUNCTION trg_onboarding_kit();

-- =====================================================
-- SEEDS
-- =====================================================
INSERT INTO cosmetic_items (slug, name, slot, rarity, unlock_level, emoji, color) VALUES
  ('default_blue', 'Azul Padrão',              'skin',       'common',    1,  '🐕', '#2563eb'),
  ('skin_green',   'Verde Faísca',             'skin',       'uncommon',  3,  '🐕', '#10b981'),
  ('skin_violet',  'Roxo Turbo',               'skin',       'rare',      7,  '🐕', '#8b5cf6'),
  ('skin_orange',  'Laranja Chama',            'skin',       'rare',      10, '🐕', '#f97316'),
  ('skin_gold',    'Dourado Lendário',         'skin',       'legendary', 25, '🐕', '#f59e0b'),
  ('hat_cap',      'Boné Pro',                 'hat',        'common',    2,  '🧢', NULL),
  ('hat_top',      'Cartola',                  'hat',        'uncommon',  5,  '🎩', NULL),
  ('hat_crown',    'Coroa Real',               'hat',        'legendary', 30, '👑', NULL),
  ('collar_red',   'Coleira Vermelha',         'collar',     'common',    1,  '🔴', NULL),
  ('collar_bow',   'Laço Azul',                'collar',     'uncommon',  4,  '🎀', NULL),
  ('collar_bell',  'Sino Dourado',             'collar',     'rare',      12, '🔔', NULL),
  ('clothes_pro',  'Uniforme Pro',             'clothes',    'uncommon',  3,  '🦺', NULL),
  ('clothes_tux',  'Traje Social',             'clothes',    'rare',      8,  '🤵', NULL),
  ('clothes_cyber','Fantasia Cyber',           'clothes',    'epic',      15, '🥷', NULL),
  ('bg_room',      'Sala de Estar',            'background', 'common',    5,  '🏠', '#dbeafe'),
  ('bg_park',      'Parque',                   'background', 'uncommon',  10, '🌳', '#dcfce7'),
  ('bg_office',    'Escritório Futurista',     'background', 'rare',      20, '🌃', '#1e293b')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO daily_goal_definitions (slug, audience, title, description, target_count, reward_food, reward_xp) VALUES
  ('goal_client_order',  'cliente',     'Solicite 1 serviço hoje',  'Contrate qualquer serviço',   1, 30, 50),
  ('goal_client_review', 'cliente',     'Avalie 1 serviço',         'Envie uma avaliação',         1, 10, 20),
  ('goal_client_fav',    'cliente',     'Favorite 1 serviço',       'Adicione aos favoritos',      1, 5,  10),
  ('goal_emp_complete',  'funcionario', 'Conclua 2 serviços hoje',  'Finalize 2 pedidos no dia',   2, 30, 50),
  ('goal_emp_punctual',  'funcionario', 'Mantenha pontualidade',    'Pontualidade ≥ 95%',          1, 20, 40),
  ('goal_emp_response',  'funcionario', 'Responda rápido',          'Responda em ≤ 10 min',        1, 15, 30)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO badges (slug, name, description, emoji, rarity) VALUES
  ('first_service',  'Primeiro Serviço', 'Concluiu o primeiro serviço',    '🌟', 'common'),
  ('7_day_streak',   'Sequência de 7',   '7 dias seguidos de metas',       '🔥', 'uncommon'),
  ('top_10_weekly',  'Top 10 Semanal',   'Entrou no top 10 do ranking',    '🏆', 'rare'),
  ('5star_50x',      '5 Estrelas 50x',   '50 avaliações 5 estrelas',       '⭐', 'rare'),
  ('level_25',       'Veterano',         'Alcançou o nível 25',            '👑', 'epic'),
  ('level_50',       'Lenda',            'Alcançou o nível 50',            '💎', 'legendary')
ON CONFLICT (slug) DO NOTHING;