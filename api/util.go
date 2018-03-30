package api

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"regexp"
	"strconv"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

const (
	TokenHeaderType string = "JWT"
	TokenHeaderAlg  string = "HS256"
)

var tokenExp *regexp.Regexp = regexp.MustCompile(`(?i:^bearer\s+([^\.]+)\.([^\.]+)\.([^\.]+)$)`)

func parseId(s string) int64 {
	id, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0
	}
	return id
}

type rawWebToken struct {
	header    []byte
	payload   []byte
	signature []byte
}

var ErrAuthMacMismatch error = errors.New("hmac mismatch")
var ErrAuthHeaderTyp error = errors.New("header: unsupported typ")
var ErrAuthHeaderAlg error = errors.New("header: unsupported alg")
var ErrAuthPayloadIssuer error = errors.New("payload: untrusted issuer")
var ErrAuthPayloadAudience error = errors.New("payload: unrecognized audience")
var ErrAuthPayloadSubjectNotFound error = errors.New("payload: subject not found")
var ErrAuthUserSecretNotSet error = errors.New("user secret not set")

func (r *rawWebToken) String() string {
	return string(r.header) + "." + string(r.payload) + "." + string(r.signature)
}

func (r *rawWebToken) Token() (*WebToken, error) {
	header := make([]byte, base64.URLEncoding.DecodedLen(len(r.header)))
	if _, err := base64.URLEncoding.Decode(header, r.header); err != nil {
		return nil, err
	}

	payload := make([]byte, base64.URLEncoding.DecodedLen(len(r.payload)))
	if _, err := base64.URLEncoding.Decode(payload, r.payload); err != nil {
		return nil, err
	}

	signature := make([]byte, base64.URLEncoding.DecodedLen(len(r.signature)))
	if _, err := base64.URLEncoding.Decode(signature, r.signature); err != nil {
		return nil, err
	}

	tokenHeader := &WebTokenHeader{}
	if err := json.Unmarshal(bytes.TrimRight(header, "\x00"), tokenHeader); err != nil {
		return nil, err
	}

	if tokenHeader.Typ != TokenHeaderType {
		return nil, ErrAuthHeaderTyp
	}
	if tokenHeader.Alg != TokenHeaderAlg {
		return nil, ErrAuthHeaderAlg
	}

	tokenPayload := &WebTokenPayload{}
	if err := json.Unmarshal(bytes.TrimRight(payload, "\x00"), tokenPayload); err != nil {
		return nil, err
	}

	apic := conf.Get().Api

	if tokenPayload.Issuer != apic.AuthIssuer {
		return nil, ErrAuthPayloadIssuer
	}
	if tokenPayload.Audience != apic.AuthAudience {
		return nil, ErrAuthPayloadAudience
	}

	userId, err := strconv.ParseInt(tokenPayload.Subject, 10, 64)
	if err != nil {
		return nil, err
	}

	user := repo.Users.Find(userId)
	if user == nil {
		return nil, ErrAuthPayloadSubjectNotFound
	}

	userSecret := repo.Users.Secret(user)
	if userSecret == "" {
		return nil, ErrAuthUserSecretNotSet
	}

	msg := append(append(r.header, 0x2e), r.payload...)
	mac := hmac.New(sha256.New, []byte(apic.Secret+userSecret))
	if _, err := mac.Write(msg); err != nil {
		return nil, err
	}

	if len(signature) > 32 {
		signature = signature[:32]
	}

	if !hmac.Equal(signature, mac.Sum(nil)) {
		return nil, ErrAuthMacMismatch
	}

	return &WebToken{
		Header:  tokenHeader,
		Payload: tokenPayload,
		User:    user,
	}, nil
}

type WebTokenHeader struct {
	Typ string `json:"typ"`
	Alg string `json:"alg"`
}

type WebTokenPayload struct {
	Issuer   string `json:"iss"`
	Audience string `json:"aud"`
	Subject  string `json:"sub"`
}

type WebToken struct {
	Header  *WebTokenHeader
	Payload *WebTokenPayload
	User    *model.User
}

// Authorization: Bearer header.payload.signature (very restricted subset of JWT)
func currentUser(rq *http.Request) *model.User {
	parts := tokenExp.FindStringSubmatch(rq.Header.Get("Authorization"))
	if len(parts) != 4 {
		log.Printf("auth: invalid Authorization header: '%s'", rq.Header.Get("Authorization"))
		return nil
	}

	raw := &rawWebToken{
		header:    []byte(parts[1]),
		payload:   []byte(parts[2]),
		signature: []byte(parts[3]),
	}

	token, err := raw.Token()
	if err != nil {
		log.Printf("auth: %v", err)
		return nil
	}

	return token.User
}
