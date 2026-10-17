package repositories

import "context"

type SiteCodeCounterRepository interface {
	// NextCode atomically increments and returns the next site code for today
	// e.g. "691017-01", "691017-02"
	NextCode(ctx context.Context, datePrefix string) (string, error)
}
