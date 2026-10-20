package serviceimpl

import (
	"context"
	"encoding/json"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/repositories"
)

type optionsServiceImpl struct {
	configRepo repositories.AppConfigRepository
}

func NewOptionsService(configRepo repositories.AppConfigRepository) *optionsServiceImpl {
	return &optionsServiceImpl{configRepo: configRepo}
}

var defaultOptions = dto.OptionsResponse{
	CustomerTypes:  []string{"ใหม่", "เก่า"},
	DecisionMakers: []string{"เจ้าของ", "ผู้รับเหมา", "วิศวกร", "สถาปนิก", "อื่นๆ"},
	Stages:         []string{"เริ่มก่อสร้าง", "กำลังสร้าง", "ใกล้เสร็จ", "รอตัดสินใจ", "เสนอราคาแล้ว", "อื่นๆ"},
	LostReasons:    []string{"ราคาสูง", "ส่งช้า", "ใช้คู่แข่ง", "เปลี่ยนใจ", "อื่นๆ"},
	Competitors:    []string{},
	Amphoes:        []string{},
	VehiclePlates:  []string{},
}

func (s *optionsServiceImpl) GetOptions(ctx context.Context) (*dto.OptionsResponse, error) {
	resp := defaultOptions

	if cfg, err := s.configRepo.Get(ctx, "dropdown_options"); err == nil {
		var dbOpts dto.OptionsResponse
		if err := json.Unmarshal([]byte(cfg.Value), &dbOpts); err == nil {
			if len(dbOpts.CustomerTypes) > 0 {
				resp.CustomerTypes = dbOpts.CustomerTypes
			}
			if len(dbOpts.DecisionMakers) > 0 {
				resp.DecisionMakers = dbOpts.DecisionMakers
			}
			if len(dbOpts.Stages) > 0 {
				resp.Stages = dbOpts.Stages
			}
			if len(dbOpts.LostReasons) > 0 {
				resp.LostReasons = dbOpts.LostReasons
			}
			if len(dbOpts.Competitors) > 0 {
				resp.Competitors = dbOpts.Competitors
			}
			if len(dbOpts.Amphoes) > 0 {
				resp.Amphoes = dbOpts.Amphoes
			}
			if len(dbOpts.VehiclePlates) > 0 {
				resp.VehiclePlates = dbOpts.VehiclePlates
			}
		}
	}

	return &resp, nil
}

func (s *optionsServiceImpl) UpdateOptions(ctx context.Context, opts *dto.OptionsResponse) error {
	data, err := json.Marshal(opts)
	if err != nil {
		return err
	}
	return s.configRepo.Set(ctx, "dropdown_options", string(data))
}
