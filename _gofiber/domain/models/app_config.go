package models

// AppConfig stores dynamic dropdown options and settings
type AppConfig struct {
	Key   string `gorm:"primaryKey"`
	Value string `gorm:"type:jsonb;not null"` // JSON array or object
}

func (AppConfig) TableName() string {
	return "app_configs"
}
