package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/user", requestUser)
}

type User struct {
	User *model.User
}

func requestUser(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	user := repo.Users.Find(parseId(query.Get("Id")))
	if user == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &User{
		User: user,
	}, nil
}

func (page *User) CanAccess(current *model.User) bool {
	return current.Is(page.User)
}

func (page *User) HandleGet(w http.ResponseWriter) error {
	return apirouter.JsonResponse(w, page.User)
}
