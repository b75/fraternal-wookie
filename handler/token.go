package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/router"
	"github.com/b75/fraternal-wookie/token"
)

func init() {
	router.RegisterHandler("/token", requestToken)
}

type Token struct {
	Token  []byte
	Expiry int64
	Error  error
}

func requestToken(rq *http.Request) (router.Handler, error) {
	token, expiry, err := token.Create(currentUser(rq))

	return &Token{
		Token:  token,
		Expiry: expiry,
		Error:  err,
	}, nil
}

func (page *Token) CanAccess() bool {
	return true
}

func (page *Token) HandleGet(w http.ResponseWriter) error {
	if page.Error == nil {
		return router.JsonResponse(w, map[string]interface{}{
			"Success": true,
			"Result": map[string]interface{}{
				"Token":  string(page.Token),
				"Expiry": page.Expiry,
			},
		})
	} else {
		return router.JsonResponse(w, map[string]interface{}{
			"Success": false,
			"Error":   page.Error.Error(),
		})
	}
}
