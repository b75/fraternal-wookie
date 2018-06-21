package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/groupfeeds", requestGroupFeeds)
}

type GroupFeeds struct {
	Group *model.Group
	Admin *model.User
	Feeds model.GroupFeeds
}

func requestGroupFeeds(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("Id")))
	if group == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &GroupFeeds{
		Group: group,
		Admin: repo.Users.Find(group.Admin),
		Feeds: repo.GroupFeeds.FindByGroup(group, parseId(query.Get("After")), nil),
	}, nil
}

func (page *GroupFeeds) CanAccess(current *model.User) bool {
	return current.Is(page.Admin) || repo.Groups.IsMember(page.Group, current)
}

func (page *GroupFeeds) HandleGet(w http.ResponseWriter) error {
	return apirouter.JsonResponse(w, page.Feeds)
}
