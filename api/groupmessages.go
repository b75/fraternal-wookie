package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/groupmessages", requestGroupMessages)
}

type GroupMessages struct {
	Group    *model.Group
	Admin    *model.User
	Messages model.GroupMessageViews
}

func requestGroupMessages(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("Id")))
	if group == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &GroupMessages{
		Group:    group,
		Admin:    repo.Users.Find(group.Admin),
		Messages: repo.GroupMessages.FindByGroup(group, parseId(query.Get("After")), parseId(query.Get("Limit"))),
	}, nil
}

func (page *GroupMessages) CanAccess(current *model.User) bool {
	return current.Is(page.Admin) || repo.Groups.IsMember(page.Group, current)
}

func (page *GroupMessages) HandleGet(w http.ResponseWriter) error {
	return apirouter.JsonResponse(w, page.Messages)
}
