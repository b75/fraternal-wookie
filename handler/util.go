package handler

import (
	"net/http"
	"strings"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func trim(s string) string {
	return strings.TrimSpace(s)
}

func currentUser(rq *http.Request) *model.User {
	cookie, err := rq.Cookie("session")
	if err != nil {
		return nil
	}

	return repo.Users.FindBySession(cookie.Value)
}
