package logger

import (
	"encoding/json"
	"log"
	"os"
	"time"
)

type Level string

const (
	LevelError Level = "ERROR"
	LevelWarn  Level = "WARN"
	LevelInfo  Level = "INFO"
	LevelDebug Level = "DEBUG"
)

type LogEntry struct {
	Timestamp string                 `json:"timestamp"`
	Level     Level                  `json:"level"`
	Message   string                 `json:"message"`
	Data      map[string]interface{} `json:"data,omitempty"`
}

type Logger struct {
	level Level
}

var Default = &Logger{level: LevelInfo}

func New(level Level) *Logger {
	return &Logger{level: level}
}

func (l *Logger) log(level Level, message string, data map[string]interface{}) {
	entry := LogEntry{
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Level:     level,
		Message:   message,
		Data:      data,
	}

	jsonData, err := json.Marshal(entry)
	if err != nil {
		log.Printf("Failed to marshal log entry: %v", err)
		return
	}

	os.Stdout.Write(append(jsonData, '\n'))
}

func (l *Logger) Error(message string, data map[string]interface{}) {
	l.log(LevelError, message, data)
}

func (l *Logger) Warn(message string, data map[string]interface{}) {
	l.log(LevelWarn, message, data)
}

func (l *Logger) Info(message string, data map[string]interface{}) {
	l.log(LevelInfo, message, data)
}

func (l *Logger) Debug(message string, data map[string]interface{}) {
	if l.level == LevelDebug {
		l.log(LevelDebug, message, data)
	}
}

// Global helper functions
func Error(message string, data map[string]interface{}) {
	Default.Error(message, data)
}

func Warn(message string, data map[string]interface{}) {
	Default.Warn(message, data)
}

func Info(message string, data map[string]interface{}) {
	Default.Info(message, data)
}

func Debug(message string, data map[string]interface{}) {
	Default.Debug(message, data)
}
