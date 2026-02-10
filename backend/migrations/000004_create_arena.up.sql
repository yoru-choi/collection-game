-- Create arena table for PvP system
CREATE TABLE IF NOT EXISTS arena (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rank INT NOT NULL DEFAULT 0,
    rating INT NOT NULL DEFAULT 1000,
    win_count INT NOT NULL DEFAULT 0,
    lose_count INT NOT NULL DEFAULT 0,
    defense_team JSONB NOT NULL DEFAULT '[]'::jsonb,
    season_id INT NOT NULL DEFAULT 1,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, season_id)
);

-- Create index for ranking queries
CREATE INDEX idx_arena_rating ON arena(rating DESC);
CREATE INDEX idx_arena_rank ON arena(rank);
CREATE INDEX idx_arena_user_id ON arena(user_id);
CREATE INDEX idx_arena_season_id ON arena(season_id);

-- Create arena_history table for battle records
CREATE TABLE IF NOT EXISTS arena_history (
    id BIGSERIAL PRIMARY KEY,
    attacker_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    defender_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    attacker_team JSONB NOT NULL,
    defender_team JSONB NOT NULL,
    winner_id BIGINT NOT NULL REFERENCES users(id),
    battle_log JSONB,
    rating_change INT NOT NULL,
    season_id INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for history queries
CREATE INDEX idx_arena_history_attacker_id ON arena_history(attacker_id);
CREATE INDEX idx_arena_history_defender_id ON arena_history(defender_id);
CREATE INDEX idx_arena_history_created_at ON arena_history(created_at DESC);

-- Create trigger for arena updated_at
CREATE TRIGGER update_arena_updated_at BEFORE UPDATE ON arena
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
