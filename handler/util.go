package handler

import (
	"errors"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func trim(s string) string {
	return strings.TrimSpace(s)
}

func checkReferer(rq *http.Request) error {
	referer, err := url.Parse(rq.Header.Get("Referer"))
	if err != nil {
		return err
	}

	sc := conf.Get().Session
	if sc.Https && referer.Scheme != "https" {
		return errors.New("scheme mismatch")
	} else if referer.Scheme != "http" {
		return errors.New("scheme mismatch")
	}

	allowed := false
	for _, ref := range sc.AllowedReferrers {
		if referer.Host == ref {
			allowed = true
			break
		}
	}
	if !allowed {
		return errors.New("host not allowed")
	}

	return nil
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

	return repo.Users.Find(session.UserId)
}

func parseId(s string) int64 {
	id, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0
	}
	return id
}
