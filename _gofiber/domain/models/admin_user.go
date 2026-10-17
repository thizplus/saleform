package models

type AdminUser struct {
	BaseModel
	Email        string `gorm:"uniqueIndex;not null"`
	PasswordHash string `gorm:"not null"`
	DisplayName  string `gorm:"not null"`
	Role         string `gorm:"not null;default:'admin'"` // admin, viewer
	IsActive     bool   `gorm:"not null;default:true"`
}
