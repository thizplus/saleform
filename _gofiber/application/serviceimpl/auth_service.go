package serviceimpl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"line-sales-api/domain/dto"
	"line-sales-api/domain/models"
	"line-sales-api/domain/repositories"
	"line-sales-api/pkg/config"
	"line-sales-api/pkg/logger"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

type authServiceImpl struct {
	jwtCfg       config.JWTConfig
	lineCfg      config.LINEConfig
	salesRepRepo repositories.SalesRepRepository
	adminRepo    repositories.AdminUserRepository
	siteRepo     repositories.SiteRepository
}

func NewAuthService(
	jwtCfg config.JWTConfig,
	lineCfg config.LINEConfig,
	salesRepRepo repositories.SalesRepRepository,
	adminRepo repositories.AdminUserRepository,
	siteRepo repositories.SiteRepository,
) *authServiceImpl {
	return &authServiceImpl{
		jwtCfg:       jwtCfg,
		lineCfg:      lineCfg,
		salesRepRepo: salesRepRepo,
		adminRepo:    adminRepo,
		siteRepo:     siteRepo,
	}
}

type lineVerifyResponse struct {
	Sub     string `json:"sub"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func (s *authServiceImpl) LIFFAuth(ctx context.Context, req *dto.LIFFAuthRequest) (*dto.LIFFAuthResponse, error) {
	// Verify ID token with LINE
	claims, err := s.verifyLINEIDToken(ctx, req.IDToken)
	if err != nil {
		logger.WarnContext(ctx, "LINE ID token verification failed", "error", err)
		return nil, errors.New("invalid ID token")
	}

	// Find or create sales rep
	rep, err := s.salesRepRepo.GetByLineUserID(ctx, claims.Sub)
	if err != nil {
		// Create new rep (pending status)
		rep = &models.SalesRep{
			BaseModel:   models.BaseModel{ID: uuid.New()},
			LineUserID:  claims.Sub,
			DisplayName: claims.Name,
			PictureURL:  claims.Picture,
			Status:      "pending",
		}
		if err := s.salesRepRepo.Create(ctx, rep); err != nil {
			logger.ErrorContext(ctx, "Failed to create sales rep", "error", err)
			return nil, errors.New("failed to create account")
		}
		logger.InfoContext(ctx, "New sales rep created", "rep_id", rep.ID, "name", rep.DisplayName)
	} else {
		// Update profile if changed
		updated := false
		if rep.DisplayName != claims.Name {
			rep.DisplayName = claims.Name
			updated = true
		}
		if rep.PictureURL != claims.Picture {
			rep.PictureURL = claims.Picture
			updated = true
		}
		if updated {
			_ = s.salesRepRepo.Update(ctx, rep)
		}
	}

	// Pending — if registration data sent, save it
	if rep.Status == "pending" && req.Nickname != "" {
		rep.Nickname = req.Nickname
		rep.Area = req.Area
		_ = s.salesRepRepo.Update(ctx, rep)
		logger.InfoContext(ctx, "Sales rep registered", "rep_id", rep.ID, "nickname", req.Nickname)
	}

	// Not active — return profile without token
	if rep.Status != "active" {
		return &dto.LIFFAuthResponse{
			Token: "",
			Profile: dto.RepProfile{
				ID:          rep.ID.String(),
				DisplayName: rep.DisplayName,
				PictureURL:  rep.PictureURL,
				Nickname:    rep.Nickname,
				Area:        rep.Area,
				Status:      rep.Status,
				Registered:  rep.Nickname != "",
			},
		}, nil
	}

	// Count sites for dashboard
	counts := s.countSites(ctx, rep.ID)

	// Generate JWT
	token, err := s.generateJWT(rep.ID.String(), "sales")
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &dto.LIFFAuthResponse{
		Token: token,
		Profile: dto.RepProfile{
			ID:          rep.ID.String(),
			DisplayName: rep.DisplayName,
			PictureURL:  rep.PictureURL,
			Nickname:    rep.Nickname,
			Area:        rep.Area,
			Status:      rep.Status,
			Registered:  true,
			Counts:      counts,
		},
	}, nil
}

func (s *authServiceImpl) RegisterRep(ctx context.Context, repID string, req *dto.RegisterRepRequest) error {
	uid, err := uuid.Parse(repID)
	if err != nil {
		return errors.New("invalid rep ID")
	}

	rep, err := s.salesRepRepo.GetByID(ctx, uid)
	if err != nil {
		return errors.New("rep not found")
	}

	if rep.Status != "pending" {
		return errors.New("can only register pending accounts")
	}

	rep.Nickname = req.Nickname
	rep.Area = req.Area
	return s.salesRepRepo.Update(ctx, rep)
}

func (s *authServiceImpl) AdminLogin(ctx context.Context, req *dto.AdminLoginRequest) (*dto.AdminLoginResponse, error) {
	user, err := s.adminRepo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.New("invalid credentials")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid credentials")
	}

	if !user.IsActive {
		return nil, errors.New("account is disabled")
	}

	token, err := s.generateJWT(user.ID.String(), user.Role)
	if err != nil {
		return nil, errors.New("failed to generate token")
	}

	return &dto.AdminLoginResponse{
		Token: token,
		User: dto.AdminProfile{
			ID:          user.ID.String(),
			Email:       user.Email,
			DisplayName: user.DisplayName,
			Role:        user.Role,
		},
	}, nil
}

func (s *authServiceImpl) verifyLINEIDToken(ctx context.Context, idToken string) (*lineVerifyResponse, error) {
	resp, err := http.PostForm("https://api.line.me/oauth2/v2.1/verify", url.Values{
		"id_token":  {idToken},
		"client_id": {s.lineCfg.LoginChannelID},
	})
	if err != nil {
		return nil, fmt.Errorf("LINE verify request failed: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("LINE verify returned %d: %s", resp.StatusCode, string(body))
	}

	var result lineVerifyResponse
	if err := json.Unmarshal(body, &result); err != nil {
		return nil, fmt.Errorf("failed to parse LINE verify response: %w", err)
	}

	if result.Sub == "" {
		return nil, errors.New("empty sub in LINE verify response")
	}

	return &result, nil
}

func (s *authServiceImpl) generateJWT(userID, role string) (string, error) {
	now := time.Now()
	claims := jwt.MapClaims{
		"userId": userID,
		"role":   role,
		"iat":    now.Unix(),
		"exp":    now.Add(time.Duration(s.jwtCfg.ExpireHours) * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtCfg.Secret))
}

func (s *authServiceImpl) countSites(ctx context.Context, repID uuid.UUID) dto.RepCounts {
	counts := dto.RepCounts{}

	_, dueTodayTotal, _ := s.siteRepo.List(ctx, repositories.SiteFilter{Tab: "due_today", RepID: &repID, Limit: 1})
	counts.DueToday = int(dueTodayTotal)

	_, overdueTotal, _ := s.siteRepo.List(ctx, repositories.SiteFilter{Tab: "overdue", RepID: &repID, Limit: 1})
	counts.Overdue = int(overdueTotal)

	_, followingTotal, _ := s.siteRepo.List(ctx, repositories.SiteFilter{Tab: "following", RepID: &repID, Limit: 1})
	counts.Following = int(followingTotal)

	return counts
}
