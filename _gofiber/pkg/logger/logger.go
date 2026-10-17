package logger

import (
	"context"
	"io"
	"log/slog"
	"os"

	"gopkg.in/natefinch/lumberjack.v2"
)

var defaultLogger *slog.Logger

func Init(env string) {
	var writers []io.Writer

	// Always log to stdout
	writers = append(writers, os.Stdout)

	// In non-test environments, also log to file
	if env != "test" {
		writers = append(writers, &lumberjack.Logger{
			Filename:   "logs/app.log",
			MaxSize:    100, // MB
			MaxBackups: 5,
			MaxAge:     30, // days
			Compress:   true,
		})
	}

	w := io.MultiWriter(writers...)

	var level slog.Level
	switch env {
	case "production":
		level = slog.LevelInfo
	default:
		level = slog.LevelDebug
	}

	handler := slog.NewJSONHandler(w, &slog.HandlerOptions{
		Level: level,
	})

	defaultLogger = slog.New(handler)
	slog.SetDefault(defaultLogger)
}

func InfoContext(ctx context.Context, msg string, args ...any) {
	slog.Default().InfoContext(ctx, msg, args...)
}

func WarnContext(ctx context.Context, msg string, args ...any) {
	slog.Default().WarnContext(ctx, msg, args...)
}

func ErrorContext(ctx context.Context, msg string, args ...any) {
	slog.Default().ErrorContext(ctx, msg, args...)
}

func DebugContext(ctx context.Context, msg string, args ...any) {
	slog.Default().DebugContext(ctx, msg, args...)
}
