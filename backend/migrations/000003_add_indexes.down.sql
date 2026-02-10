-- Remove additional indexes

DROP INDEX IF EXISTS idx_summon_history_user_type;
DROP INDEX IF EXISTS idx_dungeons_chapter_stage;
DROP INDEX IF EXISTS idx_runes_grade;
DROP INDEX IF EXISTS idx_runes_user_character_slot;
DROP INDEX IF EXISTS idx_user_characters_obtained_at;
DROP INDEX IF EXISTS idx_user_characters_awakened;
DROP INDEX IF EXISTS idx_user_characters_user_level;
DROP INDEX IF EXISTS idx_users_created_at;
DROP INDEX IF EXISTS idx_users_level;
