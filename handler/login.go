package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/login", requestLogin)
}

type Login struct {
	Action string
}

func requestLogin(rq *http.Request) (router.Handler, error) {
	return &Login{
		Action: rq.URL.Path,
	}, nil
}

func (page *Login) CanAccess() bool {
	return true
}

func (page *Login) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "auth/login.html", page)
}
