package di

import (
	"line-sales-api/domain/repositories"
	repoimpl "line-sales-api/infrastructure/postgres/repoimpl"

	"gorm.io/gorm"
)

type repositorySet struct {
	lineEvent       repositories.LineEventRepository
	lineGroup       repositories.LineGroupRepository
	salesRep        repositories.SalesRepRepository
	site            repositories.SiteRepository
	siteReport      repositories.SiteReportRepository
	contact         repositories.ContactRepository
	mediaFile       repositories.MediaFileRepository
	siteCodeCounter repositories.SiteCodeCounterRepository
	adminUser       repositories.AdminUserRepository
	reviewItem      repositories.ReviewItemRepository
	appConfig       repositories.AppConfigRepository
	analytics       repositories.AnalyticsRepository
	checkIn         repositories.CheckInRepository
}

func newRepositories(db *gorm.DB) *repositorySet {
	return &repositorySet{
		lineEvent:       repoimpl.NewLineEventRepository(db),
		lineGroup:       repoimpl.NewLineGroupRepository(db),
		salesRep:        repoimpl.NewSalesRepRepository(db),
		site:            repoimpl.NewSiteRepository(db),
		siteReport:      repoimpl.NewSiteReportRepository(db),
		contact:         repoimpl.NewContactRepository(db),
		mediaFile:       repoimpl.NewMediaFileRepository(db),
		siteCodeCounter: repoimpl.NewSiteCodeCounterRepository(db),
		adminUser:       repoimpl.NewAdminUserRepository(db),
		reviewItem:      repoimpl.NewReviewItemRepository(db),
		appConfig:       repoimpl.NewAppConfigRepository(db),
		analytics:       repoimpl.NewAnalyticsRepository(db),
		checkIn:         repoimpl.NewCheckInRepository(db),
	}
}
