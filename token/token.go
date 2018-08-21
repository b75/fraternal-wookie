package token

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
	"time"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

const (
	TokenDefaultHeader string = `eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9` //{"typ":"JWT","alg":"HS256"}
	TokenHeaderType    string = "JWT"
	TokenHeaderAlg     string = "HS256"
)

var tokenExp *regexp.Regexp = regexp.MustCompile(`(?i:^bearer\s+([^\.]+)\.([^\.]+)\.([^\.]+)$)`)

type WebTokenHeader struct {
	Typ string `json:"typ"`
	Alg string `json:"alg"`
}

type WebTokenPayload struct {
	Issuer   string `json:"iss"`
	Audience string `json:"aud"`
	Subject  string `json:"sub"`
	Expires  int64  `json:"exp"`
}

type WebToken struct {
	Header  *WebTokenHeader
	Payload *WebTokenPayload
	User    *model.User
}

func (t *WebToken) HtmlEscape() {
	if t.User != nil {
		t.User.HtmlEscape()
	}
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
var ErrAuthPayloadTokenExpired error = errors.New("token payload: token expired")
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
	if time.Now().Unix() > tokenPayload.Expires {
		return nil, ErrAuthPayloadTokenExpired
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
	if len(userSecret) == 0 {
		return nil, ErrAuthUserSecretNotSet
	}

	msg := append(append(r.header, 0x2e), r.payload...)
	mac := hmac.New(sha256.New, append([]byte(apic.Secret), userSecret...))
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

// Authorization: Bearer header.payload.signature (very restricted subset of JWT)
func Authenticate(rq *http.Request) *model.User {
	parts := tokenExp.FindStringSubmatch(rq.Header.Get("Authorization"))
	if len(parts) != 4 {
		log.Printf("token: invalid Authorization header: '%s'", rq.Header.Get("Authorization"))
		return nil
	}

	raw := &rawWebToken{
		header:    []byte(parts[1]),
		payload:   []byte(parts[2]),
		signature: []byte(parts[3]),
	}

	token, err := raw.Token()
	if err != nil {
		log.Printf("token: %v", err)
		return nil
	}

	return token.User
}

func Parse(raw []byte) (*WebToken, error) {
	parts := tokenExp.FindSubmatch(raw)
	if len(parts) != 4 {
		return nil, errors.New("parse error")
	}

	rawToken := &rawWebToken{
		header:    []byte(parts[1]),
		payload:   []byte(parts[2]),
		signature: []byte(parts[3]),
	}

	token, err := rawToken.Token()
	if err != nil {
		return nil, err
	}

	return token, nil
}

func Create(user *model.User) ([]byte, int64, error) {
	if user == nil {
		return nil, 0, errors.New("nil user")
	}

	userSecret := repo.Users.Secret(user)
	if len(userSecret) == 0 {
		return nil, 0, ErrAuthUserSecretNotSet
	}

	apic := conf.Get().Api
	expiry := time.Now().Unix() + int64(apic.Expiry)

	payload := &WebTokenPayload{
		Issuer:   apic.AuthIssuer,
		Audience: apic.AuthAudience,
		Subject:  strconv.FormatInt(user.Id, 10),
		Expires:  expiry,
	}

	payloadJson, err := json.Marshal(payload)
	if err != nil {
		return nil, 0, err
	}

	encodedPayload := make([]byte, base64.URLEncoding.EncodedLen(len(payloadJson)))
	base64.URLEncoding.Encode(encodedPayload, payloadJson)

	encodedHeader := []byte(TokenDefaultHeader)

	msg := append(append(encodedHeader, 0x2e), encodedPayload...)

	mac := hmac.New(sha256.New, append([]byte(apic.Secret), userSecret...))
	if _, err = mac.Write(msg); err != nil {
		return nil, 0, err
	}

	signature := mac.Sum(nil)
	encodedSignature := make([]byte, base64.URLEncoding.EncodedLen(len(signature)))
	base64.URLEncoding.Encode(encodedSignature, signature)

	return append(append(msg, 0x2e), encodedSignature...), expiry, nil
}
