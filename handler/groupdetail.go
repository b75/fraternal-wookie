package handler

import (
	"net/http"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/group", requestGroup)
}

type Group struct {
	CurrentUser *model.User
	Group       *model.Group
	Admin       *model.User
	Members     model.Users
	Feeds       model.GroupFeeds
}

func requestGroup(rq *http.Request) (router.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("Id")))
	if group == nil {
		return nil, router.ErrNotFound()
	}

	return &Group{
		CurrentUser: currentUser(rq),
		Group:       group,
		Admin:       repo.Users.Find(group.Admin),
		Members:     repo.Groups.Members(group),
		Feeds:       repo.GroupFeeds.FindByGroup(group, 0, nil),
	}, nil
}

func (page *Group) CanAccess() bool {
	return page.CurrentUser.Is(page.Admin)
}

func (page *Group) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "group/detail.html", page)
}
