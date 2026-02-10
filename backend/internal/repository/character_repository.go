package repository

import (
	"context"
	"database/sql"
	"fmt"

	"collection-game/internal/domain"
)

type CharacterRepository interface {
	GetByID(ctx context.Context, id int64) (*domain.Character, error)
	GetAll(ctx context.Context) ([]*domain.Character, error)
	GetByGrade(ctx context.Context, grade int) ([]*domain.Character, error)

	// User characters
	CreateUserCharacter(ctx context.Context, uc *domain.UserCharacter) error
	GetUserCharacters(ctx context.Context, userID int64) ([]*domain.UserCharacter, error)
	GetUserCharacterByID(ctx context.Context, id int64) (*domain.UserCharacter, error)
	UpdateUserCharacter(ctx context.Context, uc *domain.UserCharacter) error
	GetUserCharacterDetail(ctx context.Context, id int64) (*domain.CharacterDetail, error)
}

type characterRepository struct {
	db *sql.DB
}

func NewCharacterRepository(db *sql.DB) CharacterRepository {
	return &characterRepository{db: db}
}

func (r *characterRepository) GetByID(ctx context.Context, id int64) (*domain.Character, error) {
	query := `
		SELECT id, name, grade, element, class, base_hp, base_atk, base_def, base_spd,
		       skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url
		FROM characters WHERE id = $1
	`
	char := &domain.Character{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&char.ID, &char.Name, &char.Grade, &char.Element, &char.Class,
		&char.BaseHP, &char.BaseATK, &char.BaseDEF, &char.BaseSPD,
		&char.Skill1ID, &char.Skill2ID, &char.Skill3ID, &char.Skill4ID,
		&char.ImageURL,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("character not found")
	}
	return char, err
}

func (r *characterRepository) GetAll(ctx context.Context) ([]*domain.Character, error) {
	query := `
		SELECT id, name, grade, element, class, base_hp, base_atk, base_def, base_spd,
		       skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url
		FROM characters ORDER BY grade DESC, name
	`
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var characters []*domain.Character
	for rows.Next() {
		char := &domain.Character{}
		err := rows.Scan(
			&char.ID, &char.Name, &char.Grade, &char.Element, &char.Class,
			&char.BaseHP, &char.BaseATK, &char.BaseDEF, &char.BaseSPD,
			&char.Skill1ID, &char.Skill2ID, &char.Skill3ID, &char.Skill4ID,
			&char.ImageURL,
		)
		if err != nil {
			return nil, err
		}
		characters = append(characters, char)
	}
	return characters, rows.Err()
}

func (r *characterRepository) GetByGrade(ctx context.Context, grade int) ([]*domain.Character, error) {
	query := `
		SELECT id, name, grade, element, class, base_hp, base_atk, base_def, base_spd,
		       skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url
		FROM characters WHERE grade = $1
	`
	rows, err := r.db.QueryContext(ctx, query, grade)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var characters []*domain.Character
	for rows.Next() {
		char := &domain.Character{}
		err := rows.Scan(
			&char.ID, &char.Name, &char.Grade, &char.Element, &char.Class,
			&char.BaseHP, &char.BaseATK, &char.BaseDEF, &char.BaseSPD,
			&char.Skill1ID, &char.Skill2ID, &char.Skill3ID, &char.Skill4ID,
			&char.ImageURL,
		)
		if err != nil {
			return nil, err
		}
		characters = append(characters, char)
	}
	return characters, rows.Err()
}

func (r *characterRepository) CreateUserCharacter(ctx context.Context, uc *domain.UserCharacter) error {
	query := `
		INSERT INTO user_characters (
			user_id, character_id, level, exp, current_hp, current_atk, current_def, current_spd,
			crit_rate, crit_damage, accuracy, resistance,
			skill_1_level, skill_2_level, skill_3_level, skill_4_level, awakened
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
		RETURNING id, obtained_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		uc.UserID, uc.CharacterID, uc.Level, uc.Exp,
		uc.CurrentHP, uc.CurrentATK, uc.CurrentDEF, uc.CurrentSPD,
		uc.CritRate, uc.CritDamage, uc.Accuracy, uc.Resistance,
		uc.Skill1Level, uc.Skill2Level, uc.Skill3Level, uc.Skill4Level,
		uc.Awakened,
	).Scan(&uc.ID, &uc.ObtainedAt)
}

func (r *characterRepository) GetUserCharacters(ctx context.Context, userID int64) ([]*domain.UserCharacter, error) {
	query := `
		SELECT id, user_id, character_id, level, exp, 
		       current_hp, current_atk, current_def, current_spd,
		       crit_rate, crit_damage, accuracy, resistance,
		       skill_1_level, skill_2_level, skill_3_level, skill_4_level,
		       awakened, obtained_at
		FROM user_characters WHERE user_id = $1 ORDER BY obtained_at DESC
	`
	rows, err := r.db.QueryContext(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var characters []*domain.UserCharacter
	for rows.Next() {
		uc := &domain.UserCharacter{}
		err := rows.Scan(
			&uc.ID, &uc.UserID, &uc.CharacterID, &uc.Level, &uc.Exp,
			&uc.CurrentHP, &uc.CurrentATK, &uc.CurrentDEF, &uc.CurrentSPD,
			&uc.CritRate, &uc.CritDamage, &uc.Accuracy, &uc.Resistance,
			&uc.Skill1Level, &uc.Skill2Level, &uc.Skill3Level, &uc.Skill4Level,
			&uc.Awakened, &uc.ObtainedAt,
		)
		if err != nil {
			return nil, err
		}
		characters = append(characters, uc)
	}
	return characters, rows.Err()
}

func (r *characterRepository) GetUserCharacterByID(ctx context.Context, id int64) (*domain.UserCharacter, error) {
	query := `
		SELECT id, user_id, character_id, level, exp,
		       current_hp, current_atk, current_def, current_spd,
		       crit_rate, crit_damage, accuracy, resistance,
		       skill_1_level, skill_2_level, skill_3_level, skill_4_level,
		       awakened, obtained_at
		FROM user_characters WHERE id = $1
	`
	uc := &domain.UserCharacter{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&uc.ID, &uc.UserID, &uc.CharacterID, &uc.Level, &uc.Exp,
		&uc.CurrentHP, &uc.CurrentATK, &uc.CurrentDEF, &uc.CurrentSPD,
		&uc.CritRate, &uc.CritDamage, &uc.Accuracy, &uc.Resistance,
		&uc.Skill1Level, &uc.Skill2Level, &uc.Skill3Level, &uc.Skill4Level,
		&uc.Awakened, &uc.ObtainedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user character not found")
	}
	return uc, err
}

func (r *characterRepository) UpdateUserCharacter(ctx context.Context, uc *domain.UserCharacter) error {
	query := `
		UPDATE user_characters SET
			level = $1, exp = $2, current_hp = $3, current_atk = $4,
			current_def = $5, current_spd = $6, crit_rate = $7, crit_damage = $8,
			accuracy = $9, resistance = $10,
			skill_1_level = $11, skill_2_level = $12, skill_3_level = $13, skill_4_level = $14,
			awakened = $15
		WHERE id = $16
	`
	_, err := r.db.ExecContext(
		ctx, query,
		uc.Level, uc.Exp, uc.CurrentHP, uc.CurrentATK,
		uc.CurrentDEF, uc.CurrentSPD, uc.CritRate, uc.CritDamage,
		uc.Accuracy, uc.Resistance,
		uc.Skill1Level, uc.Skill2Level, uc.Skill3Level, uc.Skill4Level,
		uc.Awakened, uc.ID,
	)
	return err
}

func (r *characterRepository) GetUserCharacterDetail(ctx context.Context, id int64) (*domain.CharacterDetail, error) {
	query := `
		SELECT 
			uc.id, uc.user_id, uc.character_id, uc.level, uc.exp,
			uc.current_hp, uc.current_atk, uc.current_def, uc.current_spd,
			uc.crit_rate, uc.crit_damage, uc.accuracy, uc.resistance,
			uc.skill_1_level, uc.skill_2_level, uc.skill_3_level, uc.skill_4_level,
			uc.awakened, uc.obtained_at,
			c.id, c.name, c.grade, c.element, c.class,
			c.base_hp, c.base_atk, c.base_def, c.base_spd,
			c.skill_1_id, c.skill_2_id, c.skill_3_id, c.skill_4_id, c.image_url
		FROM user_characters uc
		JOIN characters c ON uc.character_id = c.id
		WHERE uc.id = $1
	`

	detail := &domain.CharacterDetail{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&detail.UserCharacter.ID, &detail.UserCharacter.UserID, &detail.UserCharacter.CharacterID, &detail.UserCharacter.Level, &detail.UserCharacter.Exp,
		&detail.UserCharacter.CurrentHP, &detail.UserCharacter.CurrentATK, &detail.UserCharacter.CurrentDEF, &detail.UserCharacter.CurrentSPD,
		&detail.UserCharacter.CritRate, &detail.UserCharacter.CritDamage, &detail.UserCharacter.Accuracy, &detail.UserCharacter.Resistance,
		&detail.UserCharacter.Skill1Level, &detail.UserCharacter.Skill2Level, &detail.UserCharacter.Skill3Level, &detail.UserCharacter.Skill4Level,
		&detail.UserCharacter.Awakened, &detail.UserCharacter.ObtainedAt,
		&detail.Character.ID, &detail.Character.Name, &detail.Character.Grade,
		&detail.Character.Element, &detail.Character.Class,
		&detail.Character.BaseHP, &detail.Character.BaseATK, &detail.Character.BaseDEF, &detail.Character.BaseSPD,
		&detail.Character.Skill1ID, &detail.Character.Skill2ID, &detail.Character.Skill3ID, &detail.Character.Skill4ID,
		&detail.Character.ImageURL,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("character detail not found")
	}
	return detail, err
}
