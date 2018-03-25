package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/", requestRoot)
	router.RegisterHandler("/index", requestIndex)
}

type Index struct {
	CurrentUser *model.User
}

func requestIndex(rq *http.Request) (router.Handler, error) {
	return &Index{
		CurrentUser: currentUser(rq),
	}, nil
}

func (page *Index) CanAccess() bool {
	return true
}

func (page *Index) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "index.html", page)
}

type Root struct{}

func requestRoot(rq *http.Request) (router.Handler, error) {
	return &Root{}, nil
}

func (page *Root) CanAccess() bool {
	return true
}

func (page *Root) HandleGet(w http.ResponseWriter) error {
	return router.Redirect("/index", http.StatusMovedPermanently)
}
