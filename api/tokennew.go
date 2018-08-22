package api

import (
	"encoding/json"
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/token"
)

func init() {
	apirouter.RegisterHandler("/token/new", requestTokenNew)
}

type TokenNew struct {
	Token  string
	Expiry int64
}

func requestTokenNew(rq *http.Request) (apirouter.Handler, error) {
	return &TokenNew{}, nil
}

func (page *TokenNew) CanAccess(current *model.User) bool {
	return true
}

func (page *TokenNew) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	p := &struct {
		Username string
		Password string
	}{}

	decoder := json.NewDecoder(rq.Body)
	if err := decoder.Decode(p); err != nil {
		return apirouter.ErrBadRequest(err)
	}

	user := repo.Users.FindByUsername(p.Username)

	if user == nil || !repo.Users.UserPasswordIs(user, p.Password) {
		return apirouter.ErrForbidden()
	}

	raw, expiry, err := token.Create(user)
	if err != nil {
		return apirouter.ErrForbidden()
	}

	page.Token = string(raw)
	page.Expiry = expiry

	return apirouter.JsonResponse(w, page)
}
