package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/user/membergroups", requestUserMemberGroups)
}

type UserMemberGroups struct {
	User   *model.User
	Groups model.Groups
}

func requestUserMemberGroups(rq *http.Request) (apirouter.Handler, error) {
	query := rq.URL.Query()

	user := repo.Users.Find(parseId(query.Get("UserId")))

	return &UserMemberGroups{
		User:   user,
		Groups: repo.Groups.FindByMember(user),
	}, nil
}

func (page *UserMemberGroups) CanAccess(current *model.User) bool {
	return current.Is(page.User)
}

func (page *UserMemberGroups) HandleGet(w http.ResponseWriter) error {
	return apirouter.JsonResponse(w, page.Groups)
}
