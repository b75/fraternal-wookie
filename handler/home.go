package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/home", requestHome)
}

type Home struct {
	CurrentUser *model.User
	User        *model.User
}

func requestHome(rq *http.Request) (router.Handler, error) {
	query := rq.URL.Query()

	user := repo.Users.FindByUsername(query.Get("Username"))
	if user == nil {
		return nil, router.ErrNotFound()
	}

	return &Home{
		CurrentUser: currentUser(rq),
		User:        user,
	}, nil
}

func (page *Home) CanAccess() bool {
	return page.CurrentUser.Is(page.User)
}

func (page *Home) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "user/home.html", page)
}
