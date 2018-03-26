package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/grouphome", requestGroupHome)
}

type GroupHome struct {
	CurrentUser *model.User
	Group       *model.Group
	Admin       *model.User
	Members     model.Users
}

func requestGroupHome(rq *http.Request) (router.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("Id")))
	if group == nil {
		return nil, router.ErrNotFound()
	}

	return &GroupHome{
		CurrentUser: currentUser(rq),
		Group:       group,
		Admin:       repo.Users.FindByUsername(group.Admin),
		Members:     repo.Groups.Members(group),
	}, nil
}

func (page *GroupHome) CanAccess() bool {
	return page.Members.Contain(page.CurrentUser) || page.CurrentUser.Is(page.Admin)
}

func (page *GroupHome) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "group/home.html", page)
}
