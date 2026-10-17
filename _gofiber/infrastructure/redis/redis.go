package redis

import (
	"context"
	"encoding/json"
	"log/slog"
	"time"

	"line-sales-api/pkg/config"

	goredis "github.com/redis/go-redis/v9"
)

type RedisClient struct {
	client *goredis.Client
}

func Connect(cfg config.RedisConfig) *RedisClient {
	client := goredis.NewClient(&goredis.Options{
		Addr:     cfg.Addr(),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		slog.Error("Failed to connect to Redis", "error", err)
		panic("failed to connect redis")
	}

	slog.Info("Redis connected", "addr", cfg.Addr())
	return &RedisClient{client: client}
}

func (r *RedisClient) Set(ctx context.Context, key string, value any, exp time.Duration) error {
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return r.client.Set(ctx, key, data, exp).Err()
}

func (r *RedisClient) Get(ctx context.Context, key string, dest any) error {
	data, err := r.client.Get(ctx, key).Bytes()
	if err != nil {
		return err
	}
	return json.Unmarshal(data, dest)
}

func (r *RedisClient) Delete(ctx context.Context, key string) error {
	return r.client.Del(ctx, key).Err()
}
