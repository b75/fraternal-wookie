package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/token"
)

func init() {
	apirouter.RegisterHandler("/token/info", requestTokenInfo)
}

type TokenInfo struct {
	Token *token.WebToken
	Error error
}

func requestTokenInfo(rq *http.Request) (apirouter.Handler, error) {

	token, err := token.Parse([]byte(rq.Header.Get("Authorization")))

	return &TokenInfo{
		Token: token,
		Error: err,
	}, nil
}

func (page *TokenInfo) CanAccess(current *model.User) bool {
	return page.Error == nil
}

func (page *TokenInfo) HandleGet(w http.ResponseWriter) error {
	return apirouter.JsonResponse(w, page.Token)
}
