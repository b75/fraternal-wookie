package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/index", requestIndex)
}

type Index struct{}

func requestIndex(rq *http.Request) (router.Handler, error) {
	return &Index{}, nil
}

func (page *Index) CanAccess() bool {
	return true
}

func (page *Index) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "index.html", nil)
}
