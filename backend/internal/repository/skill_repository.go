package repository

import (
	"context"
	"database/sql"
	"fmt"
	"strings"

	"collection-game/internal/domain"
)

type SkillRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Skill, error)
	GetByIDs(ctx context.Context, ids []int64) ([]*domain.Skill, error)
}

type skillRepository struct {
	db *sql.DB
}

func NewSkillRepository(db *sql.DB) SkillRepository {
	return &skillRepository{db: db}
}

func (r *skillRepository) GetByID(ctx context.Context, id int64) (*domain.Skill, error) {
	query := `
		SELECT id, name, description, skill_type, target_type, cooldown, multiplier, effects
		FROM skills WHERE id = $1
	`
	s := &domain.Skill{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&s.ID, &s.Name, &s.Description, &s.SkillType, &s.TargetType,
		&s.Cooldown, &s.Multiplier, &s.Effects,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("skill not found: %d", id)
	}
	return s, err
}

func (r *skillRepository) GetByIDs(ctx context.Context, ids []int64) ([]*domain.Skill, error) {
	if len(ids) == 0 {
		return nil, nil
	}

	// Build parameterized query
	placeholders := make([]string, len(ids))
	args := make([]interface{}, len(ids))
	for i, id := range ids {
		placeholders[i] = fmt.Sprintf("$%d", i+1)
		args[i] = id
	}

	query := fmt.Sprintf(`
		SELECT id, name, description, skill_type, target_type, cooldown, multiplier, effects
		FROM skills WHERE id IN (%s)
	`, strings.Join(placeholders, ","))

	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var skills []*domain.Skill
	for rows.Next() {
		s := &domain.Skill{}
		err := rows.Scan(
			&s.ID, &s.Name, &s.Description, &s.SkillType, &s.TargetType,
			&s.Cooldown, &s.Multiplier, &s.Effects,
		)
		if err != nil {
			return nil, err
		}
		skills = append(skills, s)
	}
	return skills, rows.Err()
}
