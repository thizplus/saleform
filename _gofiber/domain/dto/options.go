package dto

type OptionsResponse struct {
	CustomerTypes  []string `json:"customerTypes"`
	Stages         []string `json:"stages"`
	LostReasons    []string `json:"lostReasons"`
	Competitors    []string `json:"competitors"`
	Amphoes        []string `json:"amphoes"`
	VehiclePlates  []string `json:"vehiclePlates"`
}
