package handler

import (
	"errors"
	"net/http"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/groupchat/new", requestGroupChatNew)
}

type GroupChatNew struct {
	CurrentUser *model.User
	Group       *model.Group
	Admin       *model.User
}

func requestGroupChatNew(rq *http.Request) (router.Handler, error) {
	query := rq.URL.Query()

	group := repo.Groups.Find(parseId(query.Get("Id")))
	if group == nil {
		return nil, router.ErrNotFound()
	}

	return &GroupChatNew{
		CurrentUser: currentUser(rq),
		Group:       group,
		Admin:       repo.Users.FindByUsername(group.Admin),
	}, nil
}

func (page *GroupChatNew) CanAccess() bool {
	return repo.Groups.IsMember(page.Group, page.CurrentUser) || page.CurrentUser.Is(page.Admin)
}

func (page *GroupChatNew) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	if err := rq.ParseForm(); err != nil {
		return router.ErrBadRequest(err)
	}

	msg := trim(rq.PostForm.Get("Message"))
	if msg == "" {
		return router.ErrBadRequest(errors.New("required: Message"))
	}

	gm := &model.GroupMessage{
		GroupId:  page.Group.Id,
		Username: page.CurrentUser.Username,
		Message:  msg,
	}

	if err := repo.GroupMessages.Insert(gm); err != nil {
		return err
	}

	return router.JsonResponse(w, map[string]interface{}{
		"Success": true,
		"Id":      gm.Id,
	})
}
