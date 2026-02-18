-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    level INT DEFAULT 1,
    exp BIGINT DEFAULT 0,
    crystals BIGINT DEFAULT 0,
    gold BIGINT DEFAULT 1000,
    energy INT DEFAULT 100,
    max_energy INT DEFAULT 100,
    last_energy_update TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on username and email
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);

-- Create characters table (base character templates)
CREATE TABLE IF NOT EXISTS characters (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    grade INT NOT NULL CHECK (grade >= 1 AND grade <= 5),
    element VARCHAR(20) NOT NULL CHECK (element IN ('fire', 'water', 'wind', 'light', 'dark')),
    class VARCHAR(20) NOT NULL CHECK (class IN ('warrior', 'mage', 'healer', 'assassin', 'tank', 'support')),
    base_hp INT NOT NULL,
    base_atk INT NOT NULL,
    base_def INT NOT NULL,
    base_spd INT NOT NULL,
    skill_1_id BIGINT,
    skill_2_id BIGINT,
    skill_3_id BIGINT,
    skill_4_id BIGINT,
    image_url VARCHAR(500)
);

-- Create index on grade and element
CREATE INDEX idx_characters_grade ON characters(grade);
CREATE INDEX idx_characters_element ON characters(element);

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    skill_type VARCHAR(20) NOT NULL CHECK (skill_type IN ('damage', 'heal', 'buff', 'debuff')),
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('self', 'single_enemy', 'all_enemies', 'single_ally', 'all_allies')),
    cooldown INT DEFAULT 0,
    multiplier DECIMAL(5,2) DEFAULT 1.0,
    effects JSONB
);

-- Create user_characters table (characters owned by users)
CREATE TABLE IF NOT EXISTS user_characters (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    character_id BIGINT NOT NULL REFERENCES characters(id),
    level INT DEFAULT 1,
    exp BIGINT DEFAULT 0,
    current_hp INT NOT NULL,
    current_atk INT NOT NULL,
    current_def INT NOT NULL,
    current_spd INT NOT NULL,
    crit_rate DECIMAL(5,2) DEFAULT 5.0,
    crit_damage DECIMAL(5,2) DEFAULT 50.0,
    accuracy DECIMAL(5,2) DEFAULT 0.0,
    resistance DECIMAL(5,2) DEFAULT 0.0,
    skill_1_level INT DEFAULT 1,
    skill_2_level INT DEFAULT 1,
    skill_3_level INT DEFAULT 1,
    skill_4_level INT DEFAULT 1,
    awakened BOOLEAN DEFAULT FALSE,
    obtained_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_user_characters_user_id ON user_characters(user_id);
CREATE INDEX idx_user_characters_character_id ON user_characters(character_id);

-- Create runes table
CREATE TABLE IF NOT EXISTS runes (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_character_id BIGINT REFERENCES user_characters(id) ON DELETE SET NULL,
    slot INT NOT NULL CHECK (slot >= 1 AND slot <= 6),
    rune_type VARCHAR(20) NOT NULL,
    grade VARCHAR(20) NOT NULL CHECK (grade IN ('normal', 'magic', 'rare', 'hero', 'legend')),
    level INT DEFAULT 0 CHECK (level >= 0 AND level <= 15),
    main_stat VARCHAR(20) NOT NULL,
    main_stat_value INT NOT NULL,
    sub_stat_1 VARCHAR(20),
    sub_stat_1_value INT,
    sub_stat_2 VARCHAR(20),
    sub_stat_2_value INT,
    sub_stat_3 VARCHAR(20),
    sub_stat_3_value INT,
    sub_stat_4 VARCHAR(20),
    sub_stat_4_value INT
);

-- Create indexes
CREATE INDEX idx_runes_user_id ON runes(user_id);
CREATE INDEX idx_runes_user_character_id ON runes(user_character_id);

-- Create dungeons table
CREATE TABLE IF NOT EXISTS dungeons (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    dungeon_type VARCHAR(20) NOT NULL CHECK (dungeon_type IN ('story', 'element', 'experience', 'gold', 'boss')),
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('normal', 'hard', 'hell')),
    chapter INT DEFAULT 1,
    stage INT DEFAULT 1,
    energy_cost INT NOT NULL,
    stages JSONB NOT NULL,
    rewards JSONB NOT NULL,
    exp_reward INT DEFAULT 0,
    gold_reward INT DEFAULT 0
);

-- Create index
CREATE INDEX idx_dungeons_type_difficulty ON dungeons(dungeon_type, difficulty);

-- Create dungeon_progress table
CREATE TABLE IF NOT EXISTS dungeon_progress (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    dungeon_id BIGINT NOT NULL REFERENCES dungeons(id) ON DELETE CASCADE,
    cleared BOOLEAN DEFAULT FALSE,
    stars INT DEFAULT 0 CHECK (stars >= 0 AND stars <= 3),
    best_time INT DEFAULT 0,
    clear_count INT DEFAULT 0,
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, dungeon_id)
);

-- Create index
CREATE INDEX idx_dungeon_progress_user_id ON dungeon_progress(user_id);

-- Create summon_history table
CREATE TABLE IF NOT EXISTS summon_history (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    summon_type VARCHAR(20) NOT NULL CHECK (summon_type IN ('normal', 'premium')),
    character_id BIGINT NOT NULL REFERENCES characters(id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX idx_summon_history_user_id ON summon_history(user_id);
CREATE INDEX idx_summon_history_created_at ON summon_history(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for dungeon_progress table
CREATE TRIGGER update_dungeon_progress_updated_at BEFORE UPDATE ON dungeon_progress
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
