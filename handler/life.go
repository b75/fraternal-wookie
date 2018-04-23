package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/life", requestLife)
}

type Life struct{}

func requestLife(rq *http.Request) (router.Handler, error) {
	return &Life{}, nil
}

func (page *Life) CanAccess() bool {
	return true
}

func (page *Life) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "life/life.html", page)
}
