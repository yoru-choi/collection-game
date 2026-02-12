package repository

import (
	"context"
	"database/sql"
	"errors"

	"collection-game/internal/domain"
)

type GuildRepository struct {
	db *sql.DB
}

func NewGuildRepository(db *sql.DB) *GuildRepository {
	return &GuildRepository{db: db}
}

// GetAll gets all guilds with pagination
func (r *GuildRepository) GetAll(ctx context.Context, limit int, offset int) ([]domain.Guild, error) {
	query := `
		SELECT id, name, leader_id, level, exp, members_count, max_members,
		       description, notice, emblem, created_at, updated_at
		FROM guilds
		ORDER BY level DESC, exp DESC
		LIMIT $1 OFFSET $2
	`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var guilds []domain.Guild
	for rows.Next() {
		var g domain.Guild
		err := rows.Scan(
			&g.ID, &g.Name, &g.LeaderID, &g.Level, &g.Exp,
			&g.MembersCount, &g.MaxMembers, &g.Description,
			&g.Notice, &g.Emblem, &g.CreatedAt, &g.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		guilds = append(guilds, g)
	}

	return guilds, nil
}

// GetByID gets a guild by ID
func (r *GuildRepository) GetByID(ctx context.Context, id int64) (*domain.Guild, error) {
	query := `
		SELECT id, name, leader_id, level, exp, members_count, max_members,
		       description, notice, emblem, created_at, updated_at
		FROM guilds
		WHERE id = $1
	`

	var g domain.Guild
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&g.ID, &g.Name, &g.LeaderID, &g.Level, &g.Exp,
		&g.MembersCount, &g.MaxMembers, &g.Description,
		&g.Notice, &g.Emblem, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &g, nil
}

// GetByName gets a guild by name
func (r *GuildRepository) GetByName(ctx context.Context, name string) (*domain.Guild, error) {
	query := `
		SELECT id, name, leader_id, level, exp, members_count, max_members,
		       description, notice, emblem, created_at, updated_at
		FROM guilds
		WHERE name = $1
	`

	var g domain.Guild
	err := r.db.QueryRowContext(ctx, query, name).Scan(
		&g.ID, &g.Name, &g.LeaderID, &g.Level, &g.Exp,
		&g.MembersCount, &g.MaxMembers, &g.Description,
		&g.Notice, &g.Emblem, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &g, nil
}

// Create creates a new guild
func (r *GuildRepository) Create(ctx context.Context, guild *domain.Guild) error {
	query := `
		INSERT INTO guilds (name, leader_id, description, emblem)
		VALUES ($1, $2, $3, $4)
		RETURNING id, level, exp, members_count, max_members, created_at, updated_at
	`

	err := r.db.QueryRowContext(ctx, query,
		guild.Name, guild.LeaderID, guild.Description, guild.Emblem,
	).Scan(
		&guild.ID, &guild.Level, &guild.Exp, &guild.MembersCount,
		&guild.MaxMembers, &guild.CreatedAt, &guild.UpdatedAt,
	)

	return err
}

// Update updates guild information
func (r *GuildRepository) Update(ctx context.Context, guild *domain.Guild) error {
	query := `
		UPDATE guilds
		SET description = $1, notice = $2, emblem = $3
		WHERE id = $4
	`

	_, err := r.db.ExecContext(ctx, query,
		guild.Description, guild.Notice, guild.Emblem, guild.ID,
	)

	return err
}

// GetMembers gets all members of a guild
func (r *GuildRepository) GetMembers(ctx context.Context, guildID int64) ([]domain.GuildMemberDetail, error) {
	query := `
		SELECT gm.id, gm.guild_id, gm.user_id, gm.role, gm.contribution, gm.joined_at,
		       u.username, u.level
		FROM guild_members gm
		JOIN users u ON gm.user_id = u.id
		WHERE gm.guild_id = $1
		ORDER BY gm.role, gm.contribution DESC
	`

	rows, err := r.db.QueryContext(ctx, query, guildID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []domain.GuildMemberDetail
	for rows.Next() {
		var m domain.GuildMemberDetail
		err := rows.Scan(
			&m.ID, &m.GuildID, &m.UserID, &m.Role, &m.Contribution, &m.JoinedAt,
			&m.Username, &m.Level,
		)
		if err != nil {
			return nil, err
		}
		members = append(members, m)
	}

	return members, nil
}

// AddMember adds a member to guild
func (r *GuildRepository) AddMember(ctx context.Context, guildID int64, userID int64, role string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Insert member
	query := `
		INSERT INTO guild_members (guild_id, user_id, role)
		VALUES ($1, $2, $3)
	`
	_, err = tx.ExecContext(ctx, query, guildID, userID, role)
	if err != nil {
		return err
	}

	// Update guild member count
	query = `
		UPDATE guilds
		SET members_count = members_count + 1
		WHERE id = $1
	`
	_, err = tx.ExecContext(ctx, query, guildID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// RemoveMember removes a member from guild
func (r *GuildRepository) RemoveMember(ctx context.Context, guildID int64, userID int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Delete member
	query := `DELETE FROM guild_members WHERE guild_id = $1 AND user_id = $2`
	result, err := tx.ExecContext(ctx, query, guildID, userID)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("member not found")
	}

	// Update guild member count
	query = `
		UPDATE guilds
		SET members_count = members_count - 1
		WHERE id = $1
	`
	_, err = tx.ExecContext(ctx, query, guildID)
	if err != nil {
		return err
	}

	return tx.Commit()
}

// GetUserGuild gets the guild that a user belongs to
func (r *GuildRepository) GetUserGuild(ctx context.Context, userID int64) (*domain.Guild, error) {
	query := `
		SELECT g.id, g.name, g.leader_id, g.level, g.exp, g.members_count, g.max_members,
		       g.description, g.notice, g.emblem, g.created_at, g.updated_at
		FROM guilds g
		JOIN guild_members gm ON g.id = gm.guild_id
		WHERE gm.user_id = $1
	`

	var g domain.Guild
	err := r.db.QueryRowContext(ctx, query, userID).Scan(
		&g.ID, &g.Name, &g.LeaderID, &g.Level, &g.Exp,
		&g.MembersCount, &g.MaxMembers, &g.Description,
		&g.Notice, &g.Emblem, &g.CreatedAt, &g.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &g, nil
}
