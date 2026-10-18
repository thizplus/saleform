package config

import (
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

type Config struct {
	App      AppConfig
	DB       DBConfig
	Redis    RedisConfig
	JWT      JWTConfig
	LINE     LINEConfig
	R2       R2Config
	CORS     CORSConfig
	Business BusinessConfig
}

type AppConfig struct {
	Env  string
	Port string
}

type DBConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
	SSLMode  string
}

func (c DBConfig) DSN() string {
	return "host=" + c.Host +
		" port=" + c.Port +
		" user=" + c.User +
		" password=" + c.Password +
		" dbname=" + c.Name +
		" sslmode=" + c.SSLMode +
		" TimeZone=UTC"
}

type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

func (c RedisConfig) Addr() string {
	return c.Host + ":" + c.Port
}

type JWTConfig struct {
	Secret      string
	ExpireHours int
}

type LINEConfig struct {
	ChannelID          string
	ChannelSecret      string
	ChannelAccessToken string
	LoginChannelID     string
	LiffID             string
}

type R2Config struct {
	AccountID       string
	AccessKeyID     string
	SecretAccessKey  string
	BucketName      string
	PublicURL       string
}

type CORSConfig struct {
	Origins string
}

type BusinessConfig struct {
	BundleTimeoutMinutes int
}

func Load() *Config {
	_ = godotenv.Load()

	return &Config{
		App: AppConfig{
			Env:  getEnv("APP_ENV", "development"),
			Port: getEnv("APP_PORT", "9100"),
		},
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "linesales"),
			Password: getEnv("DB_PASSWORD", "linesales_secret"),
			Name:     getEnv("DB_NAME", "linesales_db"),
			SSLMode:  getEnv("DB_SSL_MODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       getEnvInt("REDIS_DB", 0),
		},
		JWT: JWTConfig{
			Secret:      getEnv("JWT_SECRET", "change-me"),
			ExpireHours: getEnvInt("JWT_EXPIRE_HOURS", 168),
		},
		LINE: LINEConfig{
			ChannelID:          getEnv("LINE_CHANNEL_ID", ""),
			ChannelSecret:      getEnv("LINE_CHANNEL_SECRET", ""),
			ChannelAccessToken: getEnv("LINE_CHANNEL_ACCESS_TOKEN", ""),
			LoginChannelID:     getEnv("LINE_LOGIN_CHANNEL_ID", ""),
			LiffID:             getEnv("LINE_LIFF_ID", ""),
		},
		R2: R2Config{
			AccountID:       getEnv("R2_ACCOUNT_ID", ""),
			AccessKeyID:     getEnv("R2_ACCESS_KEY_ID", ""),
			SecretAccessKey:  getEnv("R2_SECRET_ACCESS_KEY", ""),
			BucketName:      getEnv("R2_BUCKET_NAME", "line-sales-media"),
			PublicURL:       getEnv("R2_PUBLIC_URL", ""),
		},
		CORS: CORSConfig{
			Origins: getEnv("CORS_ORIGINS", "*"),
		},
		Business: BusinessConfig{
			BundleTimeoutMinutes: getEnvInt("BUNDLE_TIMEOUT_MINUTES", 10),
		},
	}
}

func getEnv(key, fallback string) string {
	if val, ok := os.LookupEnv(key); ok {
		return val
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	if val, ok := os.LookupEnv(key); ok {
		if i, err := strconv.Atoi(val); err == nil {
			return i
		}
	}
	return fallback
}
