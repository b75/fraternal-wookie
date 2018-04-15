package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/group", requestGroup)
}

type Group struct {
	Group *model.Group
	Admin *model.User
}

func requestGroup(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("Id")))
	if group == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &Group{
		Group: group,
		Admin: repo.Users.Find(group.Admin),
	}, nil
}

func (page *Group) CanAccess(current *model.User) bool {
	return current.Is(page.Admin) || repo.Groups.IsMember(page.Group, current)
}

func (page *Group) HandleGet(w http.ResponseWriter) error {
	return apirouter.JsonResponse(w, page.Group)
}
