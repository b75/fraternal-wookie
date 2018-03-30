package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/user", requestUser)
}

type User struct {
	CurrentUser *model.User
}

func requestUser(rq *http.Request) (router.Handler, error) {
	return &User{
		CurrentUser: currentUser(rq),
	}, nil
}

func (page *User) CanAccess() bool {
	return page.CurrentUser != nil // TODO acl
}

func (page *User) HandleGet(w http.ResponseWriter) error {
	if page.CurrentUser == nil {
		w.Write([]byte("nil"))
	} else {
		w.Write([]byte(page.CurrentUser.Username))
	}

	return nil
}
