package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"collection-game/config"
	"collection-game/internal/handler"
	"collection-game/internal/repository"
	"collection-game/internal/usecase"
	"collection-game/pkg/auth"
	"collection-game/pkg/cache"
	"collection-game/pkg/database"
	"collection-game/pkg/logger"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize structured logger
	if cfg.Env == "development" {
		logger.Default = logger.New(logger.LevelDebug)
	}

	logger.Info("Starting Collection Game Server", map[string]interface{}{
		"environment": cfg.Env,
		"version":     "v1.0.0",
	})

	// Initialize database
	db, err := database.New(cfg.GetDatabaseDSN())
	if err != nil {
		logger.Error("Failed to connect to database", map[string]interface{}{"error": err.Error()})
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()
	logger.Info("Database connected", nil)

	// Initialize cache
	redisCache, err := cache.New(cfg.GetRedisAddr(), cfg.Redis.Password, cfg.Redis.DB)
	if err != nil {
		logger.Warn("Failed to connect to Redis", map[string]interface{}{"error": err.Error()})
		log.Printf("Warning: Failed to connect to Redis: %v", err)
		log.Println("Continuing without cache...")
	} else {
		defer redisCache.Close()
		logger.Info("Redis/Valkey connected", nil)
	}

	// Initialize JWT
	jwtAuth := auth.NewJWT(
		cfg.JWT.Secret,
		cfg.JWT.Expiration,
		cfg.JWT.RefreshExpiration,
	)
	logger.Info("JWT initialized", map[string]interface{}{
		"expiration":         cfg.JWT.Expiration.String(),
		"refresh_expiration": cfg.JWT.RefreshExpiration.String(),
	})

	// Initialize Token Service (Valkey-based)
	var tokenService *auth.TokenService
	if redisCache != nil {
		tokenService = auth.NewTokenService(redisCache, cfg.JWT.Expiration, cfg.JWT.RefreshExpiration)
		logger.Info("Token Service initialized with Valkey", nil)
	} else {
		logger.Warn("Token Service not initialized (Valkey unavailable)", nil)
	}

	// Initialize repositories
	userRepo := repository.NewUserRepository(db.DB)
	charRepo := repository.NewCharacterRepository(db.DB)
	summonRepo := repository.NewSummonRepository(db.DB)
	dungeonRepo := repository.NewDungeonRepository(db.DB)
	logger.Info("Repositories initialized", nil)

	// Initialize use cases
	authUC := usecase.NewAuthUseCase(userRepo, jwtAuth, tokenService)
	userUC := usecase.NewUserUseCase(userRepo)
	charUC := usecase.NewCharacterUseCase(charRepo, userRepo)
	summonUC := usecase.NewSummonUseCase(userRepo, charRepo, summonRepo)
	dungeonUC := usecase.NewDungeonUseCase(dungeonRepo, userRepo)
	logger.Info("Use cases initialized", nil)

	// Initialize WebSocket Hub
	wsHub := handler.NewHub()
	go wsHub.Run()
	logger.Info("WebSocket hub started", nil)

	// Initialize handlers
	authHandler := handler.NewAuthHandler(authUC)
	userHandler := handler.NewUserHandler(userUC)
	charHandler := handler.NewCharacterHandler(charUC)
	summonHandler := handler.NewSummonHandler(summonUC)
	dungeonHandler := handler.NewDungeonHandler(dungeonUC)
	wsHandler := handler.NewWebSocketHandler(wsHub)
	logger.Info("Handlers initialized", nil)

	// Initialize router
	router := handler.NewRouter(
		jwtAuth,
		tokenService,
		authHandler,
		userHandler,
		charHandler,
		summonHandler,
		dungeonHandler,
		wsHandler,
	)
	logger.Info("Router initialized", nil)

	// Start HTTP server
	addr := fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port)
	server := &http.Server{
		Addr:    addr,
		Handler: router,
	}

	// Graceful shutdown
	go func() {
		sigChan := make(chan os.Signal, 1)
		signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)
		<-sigChan

		logger.Info("Shutting down server", nil)
		if err := server.Close(); err != nil {
			logger.Error("Error closing server", map[string]interface{}{"error": err.Error()})
		}
	}()

	// Start server
	logger.Info("Server started", map[string]interface{}{
		"address": addr,
		"health":  fmt.Sprintf("http://%s/health", addr),
		"api":     fmt.Sprintf("http://%s/api/v1", addr),
		"ws":      fmt.Sprintf("ws://%s/ws", addr),
	})

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		logger.Error("Server error", map[string]interface{}{"error": err.Error()})
		log.Fatalf("Server error: %v", err)
	}

	logger.Info("Server stopped", nil)
}
