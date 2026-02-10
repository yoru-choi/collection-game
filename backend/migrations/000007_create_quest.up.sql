-- Create quests table
CREATE TABLE IF NOT EXISTS quests (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    quest_type VARCHAR(20) NOT NULL CHECK (quest_type IN ('daily', 'weekly', 'monthly', 'story', 'achievement')),
    condition_type VARCHAR(50) NOT NULL CHECK (condition_type IN (
        'login', 'summon', 'dungeon_clear', 'arena_win', 
        'level_up_character', 'evolve_character', 'enhance_rune',
        'collect_gold', 'spend_energy'
    )),
    condition_target INT NOT NULL DEFAULT 1,
    rewards JSONB NOT NULL,
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_quests_type ON quests(quest_type);
CREATE INDEX idx_quests_active ON quests(is_active);

-- Create user_quests table for tracking quest progress
CREATE TABLE IF NOT EXISTS user_quests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    quest_id BIGINT NOT NULL REFERENCES quests(id) ON DELETE CASCADE,
    progress INT DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_claimed BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMP,
    claimed_at TIMESTAMP,
    expires_at TIMESTAMP,
    UNIQUE(user_id, quest_id, started_at)
);

-- Create indexes
CREATE INDEX idx_user_quests_user_id ON user_quests(user_id);
CREATE INDEX idx_user_quests_quest_id ON user_quests(quest_id);
CREATE INDEX idx_user_quests_completed ON user_quests(is_completed);
CREATE INDEX idx_user_quests_claimed ON user_quests(is_claimed);
CREATE INDEX idx_user_quests_expires_at ON user_quests(expires_at);

-- Create daily_login_rewards table
CREATE TABLE IF NOT EXISTS daily_login_rewards (
    id BIGSERIAL PRIMARY KEY,
    day INT NOT NULL UNIQUE,
    rewards JSONB NOT NULL
);

-- Create user_daily_login table
CREATE TABLE IF NOT EXISTS user_daily_login (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    login_day INT NOT NULL DEFAULT 1,
    last_login_date DATE NOT NULL,
    total_login_days INT NOT NULL DEFAULT 1,
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_user_daily_login_user_id ON user_daily_login(user_id);
