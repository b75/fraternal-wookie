package handler

import (
	"net/http"
	"strconv"
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

	session := repo.Sessions.Find(cookie.Value)
	if session == nil || session.Expired() {
		return nil
	}

	return repo.Users.FindByUsername(session.Username)
}

func parseId(s string) int64 {
	id, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0
	}
	return id
}
