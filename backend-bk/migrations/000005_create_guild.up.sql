-- Create guilds table
CREATE TABLE IF NOT EXISTS guilds (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    leader_id BIGINT NOT NULL REFERENCES users(id),
    level INT DEFAULT 1,
    exp BIGINT DEFAULT 0,
    members_count INT DEFAULT 1,
    max_members INT DEFAULT 20,
    description TEXT,
    notice TEXT,
    emblem VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_guilds_name ON guilds(name);
CREATE INDEX idx_guilds_leader_id ON guilds(leader_id);

-- Create guild_members table
CREATE TABLE IF NOT EXISTS guild_members (
    id BIGSERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('leader', 'officer', 'member')) DEFAULT 'member',
    contribution INT DEFAULT 0,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_guild_members_guild_id ON guild_members(guild_id);
CREATE INDEX idx_guild_members_user_id ON guild_members(user_id);

-- Create guild_applications table
CREATE TABLE IF NOT EXISTS guild_applications (
    id BIGSERIAL PRIMARY KEY,
    guild_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT,
    status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(guild_id, user_id)
);

-- Create indexes
CREATE INDEX idx_guild_applications_guild_id ON guild_applications(guild_id);
CREATE INDEX idx_guild_applications_user_id ON guild_applications(user_id);
CREATE INDEX idx_guild_applications_status ON guild_applications(status);

-- Create guild_wars table for guild battles
CREATE TABLE IF NOT EXISTS guild_wars (
    id BIGSERIAL PRIMARY KEY,
    guild_a_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    guild_b_id BIGINT NOT NULL REFERENCES guilds(id) ON DELETE CASCADE,
    guild_a_score INT DEFAULT 0,
    guild_b_score INT DEFAULT 0,
    winner_guild_id BIGINT REFERENCES guilds(id),
    war_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('scheduled', 'ongoing', 'completed')) DEFAULT 'scheduled',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_guild_wars_guild_a_id ON guild_wars(guild_a_id);
CREATE INDEX idx_guild_wars_guild_b_id ON guild_wars(guild_b_id);
CREATE INDEX idx_guild_wars_status ON guild_wars(status);
CREATE INDEX idx_guild_wars_war_date ON guild_wars(war_date);

-- Create triggers
CREATE TRIGGER update_guilds_updated_at BEFORE UPDATE ON guilds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guild_applications_updated_at BEFORE UPDATE ON guild_applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guild_wars_updated_at BEFORE UPDATE ON guild_wars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
