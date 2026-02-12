-- Create party members table for user-selected battle teams
CREATE TABLE IF NOT EXISTS party_members (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_index INT NOT NULL CHECK (slot_index >= 0 AND slot_index <= 3),
    user_character_id BIGINT NOT NULL REFERENCES user_characters(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, slot_index)
);

CREATE INDEX IF NOT EXISTS idx_party_members_user_id ON party_members(user_id);
