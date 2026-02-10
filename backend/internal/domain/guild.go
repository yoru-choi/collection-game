package domain

import (
	"time"
)

// Guild represents a guild
type Guild struct {
	ID           int64     `json:"id" db:"id"`
	Name         string    `json:"name" db:"name"`
	LeaderID     int64     `json:"leader_id" db:"leader_id"`
	Level        int       `json:"level" db:"level"`
	Exp          int64     `json:"exp" db:"exp"`
	MembersCount int       `json:"members_count" db:"members_count"`
	MaxMembers   int       `json:"max_members" db:"max_members"`
	Description  *string   `json:"description" db:"description"`
	Notice       *string   `json:"notice" db:"notice"`
	Emblem       *string   `json:"emblem" db:"emblem"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// GuildMember represents a guild member
type GuildMember struct {
	ID           int64     `json:"id" db:"id"`
	GuildID      int64     `json:"guild_id" db:"guild_id"`
	UserID       int64     `json:"user_id" db:"user_id"`
	Role         string    `json:"role" db:"role"` // leader, officer, member
	Contribution int       `json:"contribution" db:"contribution"`
	JoinedAt     time.Time `json:"joined_at" db:"joined_at"`
}

// GuildMemberDetail includes user information
type GuildMemberDetail struct {
	GuildMember
	Username string `json:"username"`
	Level    int    `json:"level"`
}

// GuildApplication represents a guild join application
type GuildApplication struct {
	ID        int64     `json:"id" db:"id"`
	GuildID   int64     `json:"guild_id" db:"guild_id"`
	UserID    int64     `json:"user_id" db:"user_id"`
	Message   *string   `json:"message" db:"message"`
	Status    string    `json:"status" db:"status"` // pending, approved, rejected
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// GuildWar represents a guild vs guild battle
type GuildWar struct {
	ID            int64     `json:"id" db:"id"`
	GuildAID      int64     `json:"guild_a_id" db:"guild_a_id"`
	GuildBID      int64     `json:"guild_b_id" db:"guild_b_id"`
	GuildAScore   int       `json:"guild_a_score" db:"guild_a_score"`
	GuildBScore   int       `json:"guild_b_score" db:"guild_b_score"`
	WinnerGuildID *int64    `json:"winner_guild_id" db:"winner_guild_id"`
	WarDate       time.Time `json:"war_date" db:"war_date"`
	Status        string    `json:"status" db:"status"` // scheduled, ongoing, completed
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time `json:"updated_at" db:"updated_at"`
}

// CreateGuildRequest represents a guild creation request
type CreateGuildRequest struct {
	Name        string  `json:"name" binding:"required,min=2,max=50"`
	Description *string `json:"description"`
	Emblem      *string `json:"emblem"`
}

// UpdateGuildRequest represents a guild update request
type UpdateGuildRequest struct {
	Description *string `json:"description"`
	Notice      *string `json:"notice"`
	Emblem      *string `json:"emblem"`
}

// GuildApplicationRequest represents a guild join application request
type GuildApplicationRequest struct {
	Message *string `json:"message"`
}
