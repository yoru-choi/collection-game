-- Drop triggers
DROP TRIGGER IF EXISTS update_dungeon_progress_updated_at ON dungeon_progress;
DROP TRIGGER IF EXISTS update_users_updated_at ON users;

-- Drop function
DROP FUNCTION IF EXISTS update_updated_at_column();

-- Drop tables in reverse order
DROP TABLE IF EXISTS summon_history;
DROP TABLE IF EXISTS dungeon_progress;
DROP TABLE IF EXISTS dungeons;
DROP TABLE IF EXISTS runes;
DROP TABLE IF EXISTS user_characters;
DROP TABLE IF EXISTS skills;
DROP TABLE IF EXISTS characters;
DROP TABLE IF EXISTS users;
