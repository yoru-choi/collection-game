CREATE TABLE IF NOT EXISTS user_items (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_type VARCHAR(50) NOT NULL,
  item_id BIGINT NOT NULL DEFAULT 0,
  item_name VARCHAR(100) NOT NULL DEFAULT '',
  quantity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, item_type, item_id)
);

CREATE INDEX IF NOT EXISTS idx_user_items_user_id ON user_items(user_id);

-- Weekly quest templates
CREATE TABLE IF NOT EXISTS weekly_quests (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(2048),
  condition_type VARCHAR(50) NOT NULL,
  condition_target INTEGER NOT NULL DEFAULT 1,
  rewards JSONB NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO weekly_quests (name, description, condition_type, condition_target, rewards, order_index)
VALUES
  ('Clear 10 Dungeons', 'Complete any dungeon 10 times this week', 'dungeon_clear', 10, '[{"type":"currency","name":"crystal","quantity":50}]', 1),
  ('Summon 5 Times', 'Perform 5 summons this week', 'summon', 5, '[{"type":"currency","name":"gold","quantity":10000}]', 2),
  ('Level Up 3 Characters', 'Level up any 3 characters this week', 'level_up', 3, '[{"type":"currency","name":"crystal","quantity":30}]', 3),
  ('Win 5 Arena Battles', 'Win 5 battles in Arena this week', 'arena_win', 5, '[{"type":"currency","name":"crystal","quantity":80}]', 4);

-- Achievement templates
CREATE TABLE IF NOT EXISTS achievements (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description VARCHAR(2048),
  condition_type VARCHAR(50) NOT NULL,
  condition_target INTEGER NOT NULL DEFAULT 1,
  rewards JSONB NOT NULL DEFAULT '[]',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

INSERT INTO achievements (name, description, condition_type, condition_target, rewards, order_index)
VALUES
  ('First Victory', 'Clear your first dungeon', 'dungeon_clear', 1, '[{"type":"currency","name":"crystal","quantity":100}]', 1),
  ('Summoner Beginner', 'Summon 10 characters', 'summon', 10, '[{"type":"currency","name":"crystal","quantity":50}]', 2),
  ('Summoner Intermediate', 'Summon 50 characters', 'summon', 50, '[{"type":"currency","name":"crystal","quantity":200}]', 3),
  ('Dungeon Explorer', 'Clear 10 different dungeons', 'dungeon_clear', 10, '[{"type":"currency","name":"crystal","quantity":100}]', 4),
  ('Dungeon Master', 'Clear 30 different dungeons', 'dungeon_clear', 30, '[{"type":"currency","name":"crystal","quantity":300}]', 5),
  ('Power Leveler', 'Level up characters 20 times', 'level_up', 20, '[{"type":"currency","name":"gold","quantity":20000}]', 6),
  ('Rich Player', 'Accumulate 100000 gold', 'gold_total', 100000, '[{"type":"currency","name":"crystal","quantity":100}]', 7),
  ('Loyal Player', 'Log in 7 consecutive days', 'login_streak', 7, '[{"type":"currency","name":"crystal","quantity":200}]', 8);
