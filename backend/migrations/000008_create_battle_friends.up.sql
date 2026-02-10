-- Create battles table for tracking ongoing battles
CREATE TABLE IF NOT EXISTS battles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    battle_type VARCHAR(20) NOT NULL CHECK (battle_type IN ('dungeon', 'arena', 'guild_war', 'boss_raid')),
    reference_id BIGINT, -- dungeon_id, arena opponent_id, etc.
    player_team JSONB NOT NULL,
    enemy_team JSONB NOT NULL,
    current_turn INT DEFAULT 1,
    battle_state JSONB NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('ongoing', 'victory', 'defeat', 'timeout')) DEFAULT 'ongoing',
    rewards JSONB,
    started_at TIMESTAMP NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_battles_user_id ON battles(user_id);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_started_at ON battles(started_at);

-- Create battle_turns table for detailed turn-by-turn log
CREATE TABLE IF NOT EXISTS battle_turns (
    id BIGSERIAL PRIMARY KEY,
    battle_id BIGINT NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    turn_number INT NOT NULL,
    actor_id BIGINT NOT NULL, -- user_character_id
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('attack', 'skill', 'item', 'defend', 'pass')),
    target_id BIGINT,
    skill_id BIGINT REFERENCES skills(id),
    damage INT DEFAULT 0,
    heal INT DEFAULT 0,
    effects JSONB,
    turn_result JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_battle_turns_battle_id ON battle_turns(battle_id);
CREATE INDEX idx_battle_turns_turn_number ON battle_turns(turn_number);

-- Create friends table
CREATE TABLE IF NOT EXISTS friends (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'accepted', 'blocked')) DEFAULT 'pending',
    requested_at TIMESTAMP NOT NULL DEFAULT NOW(),
    accepted_at TIMESTAMP,
    UNIQUE(user_id, friend_id),
    CHECK (user_id != friend_id)
);

-- Create indexes
CREATE INDEX idx_friends_user_id ON friends(user_id);
CREATE INDEX idx_friends_friend_id ON friends(friend_id);
CREATE INDEX idx_friends_status ON friends(status);

-- Create friend_points table for tracking friendship points
CREATE TABLE IF NOT EXISTS friend_points (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INT NOT NULL DEFAULT 0,
    last_sent_date DATE,
    last_received_date DATE,
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_friend_points_user_id ON friend_points(user_id);
