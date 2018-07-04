package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/userhome", requestUserHome)
}

type UserHome struct {
	CurrentUser *model.User
	User        *model.User
	Groups      model.Groups
	AdminGroups model.Groups
}

func requestUserHome(rq *http.Request) (router.Handler, error) {
	query := rq.URL.Query()

	user := repo.Users.Find(parseId(query.Get("Id")))
	if user == nil {
		return nil, router.ErrNotFound()
	}

	return &UserHome{
		CurrentUser: currentUser(rq),
		User:        user,
		Groups:      repo.Groups.FindByMember(user),
		AdminGroups: repo.Groups.FindByAdmin(user),
	}, nil
}

func (page *UserHome) CanAccess() bool {
	return page.CurrentUser.Is(page.User)
}

func (page *UserHome) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "user/home.html", page)
}
