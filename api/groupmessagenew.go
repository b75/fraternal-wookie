package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/event"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/groupmessage/new", requestGroupMessageNew)
}

type GroupMessageNew struct {
	User  *model.User
	Group *model.Group
	Admin *model.User
}

func requestGroupMessageNew(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("GroupId")))
	if group == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &GroupMessageNew{
		Group: group,
		Admin: repo.Users.Find(group.Admin),
	}, nil
}

func (page *GroupMessageNew) CanAccess(current *model.User) bool {
	page.User = current

	return current.Is(page.Admin) || repo.Groups.IsMember(page.Group, current)
}

func (page *GroupMessageNew) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	p := &struct {
		Message string
	}{}

	decoder := json.NewDecoder(rq.Body)
	if err := decoder.Decode(p); err != nil {
		return apirouter.ErrBadRequest(err)
	}

	p.Message = strings.TrimSpace(p.Message)
	if p.Message == "" {
		return apirouter.ErrBadRequest(errors.New("required: Message"))
	}

	msg := &model.GroupMessage{
		GroupId: page.Group.Id,
		UserId:  page.User.Id,
		Message: p.Message,
	}

	if err := repo.GroupMessages.Insert(msg); err != nil {
		return err
	}
	broadcaster.Event(&event.NewGroupMessageEvent{
		Group: page.Group,
		Admin: page.Admin,
	})

	return apirouter.JsonResponse(w, msg)
}
