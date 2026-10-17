package dto

type GroupResponse struct {
	ID           string `json:"id"`
	GroupID      string `json:"groupId"`
	GroupName    string `json:"groupName"`
	IsSalesGroup bool   `json:"isSalesGroup"`
	MemberCount  int    `json:"memberCount"`
}

type UpdateGroupRequest struct {
	IsSalesGroup *bool `json:"isSalesGroup"`
}
