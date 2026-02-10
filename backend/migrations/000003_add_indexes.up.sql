-- Add additional indexes for performance optimization

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_level ON users(level DESC);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- User characters indexes
CREATE INDEX IF NOT EXISTS idx_user_characters_user_level ON user_characters(user_id, level DESC);
CREATE INDEX IF NOT EXISTS idx_user_characters_awakened ON user_characters(awakened);
CREATE INDEX IF NOT EXISTS idx_user_characters_obtained_at ON user_characters(obtained_at DESC);

-- Runes indexes  
CREATE INDEX IF NOT EXISTS idx_runes_user_character_slot ON runes(user_character_id, slot);
CREATE INDEX IF NOT EXISTS idx_runes_grade ON runes(grade);

-- Dungeons indexes
CREATE INDEX IF NOT EXISTS idx_dungeons_chapter_stage ON dungeons(chapter, stage);

-- Summon history indexes
CREATE INDEX IF NOT EXISTS idx_summon_history_user_type ON summon_history(user_id, summon_type);
