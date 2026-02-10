package config

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"github.com/joho/godotenv"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Game     GameConfig
	Env      string
}

type ServerConfig struct {
	Host     string
	Port     string
	GRPCPort string
}

type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

type JWTConfig struct {
	Secret            string
	Expiration        time.Duration
	RefreshExpiration time.Duration
}

type GameConfig struct {
	MaxEnergy          int
	EnergyRegenMinutes int
}

func Load() (*Config, error) {
	// Load .env file if it exists
	_ = godotenv.Load()

	jwtExpiration, err := time.ParseDuration(getEnv("JWT_EXPIRATION", "24h"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRATION: %w", err)
	}

	jwtRefreshExpiration, err := time.ParseDuration(getEnv("JWT_REFRESH_EXPIRATION", "168h"))
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_REFRESH_EXPIRATION: %w", err)
	}

	redisDB, err := strconv.Atoi(getEnv("REDIS_DB", "0"))
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_DB: %w", err)
	}

	maxEnergy, err := strconv.Atoi(getEnv("MAX_ENERGY", "100"))
	if err != nil {
		return nil, fmt.Errorf("invalid MAX_ENERGY: %w", err)
	}

	energyRegenMinutes, err := strconv.Atoi(getEnv("ENERGY_REGEN_MINUTES", "5"))
	if err != nil {
		return nil, fmt.Errorf("invalid ENERGY_REGEN_MINUTES: %w", err)
	}

	config := &Config{
		Server: ServerConfig{
			Host:     getEnv("SERVER_HOST", "localhost"),
			Port:     getEnv("SERVER_PORT", "8080"),
			GRPCPort: getEnv("GRPC_PORT", "50051"),
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			Name:     getEnv("DB_NAME", "collection_game"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       redisDB,
		},
		JWT: JWTConfig{
			Secret:            getEnv("JWT_SECRET", "your-secret-key"),
			Expiration:        jwtExpiration,
			RefreshExpiration: jwtRefreshExpiration,
		},
		Game: GameConfig{
			MaxEnergy:          maxEnergy,
			EnergyRegenMinutes: energyRegenMinutes,
		},
		Env: getEnv("ENV", "development"),
	}

	return config, nil
}

func (c *Config) GetDatabaseDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Database.Host,
		c.Database.Port,
		c.Database.User,
		c.Database.Password,
		c.Database.Name,
		c.Database.SSLMode,
	)
}

func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%s", c.Redis.Host, c.Redis.Port)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
