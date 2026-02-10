package domain

import "time"

type User struct {
	ID               int64     `json:"id" db:"id"`
	Username         string    `json:"username" db:"username"`
	Email            string    `json:"email" db:"email"`
	PasswordHash     string    `json:"-" db:"password_hash"`
	Level            int       `json:"level" db:"level"`
	Exp              int64     `json:"exp" db:"exp"`
	Crystals         int64     `json:"crystals" db:"crystals"`     // Premium currency
	Gold             int64     `json:"gold" db:"gold"`             // Basic currency
	Energy           int       `json:"energy" db:"energy"`         // Current energy
	MaxEnergy        int       `json:"max_energy" db:"max_energy"` // Maximum energy
	LastEnergyUpdate time.Time `json:"last_energy_update" db:"last_energy_update"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

type UserProfile struct {
	ID        int64  `json:"id"`
	Username  string `json:"username"`
	Level     int    `json:"level"`
	Exp       int64  `json:"exp"`
	Crystals  int64  `json:"crystals"`
	Gold      int64  `json:"gold"`
	Energy    int    `json:"energy"`
	MaxEnergy int    `json:"max_energy"`
}

// ToProfile converts User to UserProfile (without sensitive data)
func (u *User) ToProfile() *UserProfile {
	return &UserProfile{
		ID:        u.ID,
		Username:  u.Username,
		Level:     u.Level,
		Exp:       u.Exp,
		Crystals:  u.Crystals,
		Gold:      u.Gold,
		Energy:    u.Energy,
		MaxEnergy: u.MaxEnergy,
	}
}
