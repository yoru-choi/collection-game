package repository

import (
	"context"
	"database/sql"
	"fmt"

	"collection-game/internal/domain"
)

type UserRepository interface {
	Create(ctx context.Context, user *domain.User) error
	GetByID(ctx context.Context, id int64) (*domain.User, error)
	GetByUsername(ctx context.Context, username string) (*domain.User, error)
	GetByEmail(ctx context.Context, email string) (*domain.User, error)
	Update(ctx context.Context, user *domain.User) error
	UpdateEnergy(ctx context.Context, userID int64, energy int) error
	UpdateCurrency(ctx context.Context, userID int64, crystals, gold int64) error
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (username, email, password_hash, level, exp, crystals, gold, energy, max_energy, last_energy_update)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING id, created_at, updated_at
	`
	return r.db.QueryRowContext(
		ctx, query,
		user.Username, user.Email, user.PasswordHash,
		user.Level, user.Exp, user.Crystals, user.Gold,
		user.Energy, user.MaxEnergy, user.LastEnergyUpdate,
	).Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt)
}

func (r *userRepository) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, level, exp, crystals, gold,
		       energy, max_energy, last_energy_update, created_at, updated_at
		FROM users WHERE id = $1
	`
	user := &domain.User{}
	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.Level, &user.Exp, &user.Crystals, &user.Gold,
		&user.Energy, &user.MaxEnergy, &user.LastEnergyUpdate,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, level, exp, crystals, gold,
		       energy, max_energy, last_energy_update, created_at, updated_at
		FROM users WHERE username = $1
	`
	user := &domain.User{}
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.Level, &user.Exp, &user.Crystals, &user.Gold,
		&user.Energy, &user.MaxEnergy, &user.LastEnergyUpdate,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, username, email, password_hash, level, exp, crystals, gold,
		       energy, max_energy, last_energy_update, created_at, updated_at
		FROM users WHERE email = $1
	`
	user := &domain.User{}
	err := r.db.QueryRowContext(ctx, query, email).Scan(
		&user.ID, &user.Username, &user.Email, &user.PasswordHash,
		&user.Level, &user.Exp, &user.Crystals, &user.Gold,
		&user.Energy, &user.MaxEnergy, &user.LastEnergyUpdate,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("user not found")
	}
	return user, err
}

func (r *userRepository) Update(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users 
		SET username = $1, email = $2, level = $3, exp = $4, 
		    crystals = $5, gold = $6, energy = $7, max_energy = $8,
		    last_energy_update = $9
		WHERE id = $10
	`
	_, err := r.db.ExecContext(
		ctx, query,
		user.Username, user.Email, user.Level, user.Exp,
		user.Crystals, user.Gold, user.Energy, user.MaxEnergy,
		user.LastEnergyUpdate, user.ID,
	)
	return err
}

func (r *userRepository) UpdateEnergy(ctx context.Context, userID int64, energy int) error {
	query := `UPDATE users SET energy = $1, last_energy_update = NOW() WHERE id = $2`
	_, err := r.db.ExecContext(ctx, query, energy, userID)
	return err
}

func (r *userRepository) UpdateCurrency(ctx context.Context, userID int64, crystals, gold int64) error {
	query := `UPDATE users SET crystals = crystals + $1, gold = gold + $2 WHERE id = $3`
	_, err := r.db.ExecContext(ctx, query, crystals, gold, userID)
	return err
}
