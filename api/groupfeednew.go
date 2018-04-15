package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/groupfeed/new", requestGroupFeedNew)
}

type GroupFeedNew struct {
	User  *model.User
	Group *model.Group
	Admin *model.User
}

func requestGroupFeedNew(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("GroupId")))
	if group == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &GroupFeedNew{
		Group: group,
		Admin: repo.Users.Find(group.Admin),
	}, nil
}

func (page *GroupFeedNew) CanAccess(current *model.User) bool {
	page.User = current
	return current.Is(page.Admin)
}

func (page *GroupFeedNew) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	p := &struct {
		Header string
		Body   string
	}{}

	decoder := json.NewDecoder(rq.Body)
	if err := decoder.Decode(p); err != nil {
		return apirouter.ErrBadRequest(err)
	}

	p.Header = strings.TrimSpace(p.Header)
	p.Body = strings.TrimSpace(p.Body)

	if p.Header == "" {
		return apirouter.ErrBadRequest(errors.New("required: Header"))
	}
	if p.Body == "" {
		return apirouter.ErrBadRequest(errors.New("required: Body"))
	}

	feed := &model.GroupFeed{
		GroupId: page.Group.Id,
		UserId:  page.User.Id,
		Header:  p.Header,
		Body:    p.Body,
	}

	if err := repo.GroupFeeds.Insert(feed); err != nil {
		return err
	}

	return apirouter.JsonResponse(w, feed)
}
