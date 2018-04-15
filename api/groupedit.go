package api

import (
	"encoding/json"
	"html/template"
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/event"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/group/edit", requestGroupEdit)
}

type GroupEdit struct {
	Group *model.Group
	Admin *model.User
}

func requestGroupEdit(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("Id")))
	if group == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &GroupEdit{
		Group: group,
		Admin: repo.Users.Find(group.Admin),
	}, nil
}

func (page *GroupEdit) CanAccess(current *model.User) bool {
	return current.Is(page.Admin)
}

func (page *GroupEdit) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	p := &struct {
		Name        string
		Description string
	}{}

	decoder := json.NewDecoder(rq.Body)
	if err := decoder.Decode(p); err != nil {
		return apirouter.ErrBadRequest(err)
	}

	page.Group.Name = p.Name
	page.Group.Description = p.Description
	if err := repo.Groups.Update(page.Group); err != nil {
		return err
	}
	broadcaster.Event(&event.GroupDetailEditEvent{
		Group: page.Group,
		Admin: page.Admin,
	})

	page.Group.Name = template.HTMLEscapeString(page.Group.Name)
	page.Group.Description = template.HTMLEscapeString(page.Group.Description) // TODO move to apirouter.jsonResponse
	return apirouter.JsonResponse(w, page.Group)
}
