CREATE TABLE IF NOT EXISTS user_dungeon_progress (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dungeon_id BIGINT NOT NULL,
  cleared_at TIMESTAMP NOT NULL,
  UNIQUE(user_id, dungeon_id)
);

CREATE INDEX IF NOT EXISTS idx_user_dungeon_progress_user_id ON user_dungeon_progress(user_id);
