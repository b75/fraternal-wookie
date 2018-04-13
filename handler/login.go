package handler

import (
	"fmt"
	"net/http"
	"time"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/login", requestLogin)
}

type Login struct {
	Action string
	Errors []string
}

func requestLogin(rq *http.Request) (router.Handler, error) {
	return &Login{
		Action: rq.URL.Path,
		Errors: []string{},
	}, nil
}

func (page *Login) CanAccess() bool {
	return true
}

func (page *Login) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "auth/login.html", page)
}

func (page *Login) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	if err := checkReferer(rq); err != nil {
		return router.ErrForbidden()
	}
	if err := rq.ParseForm(); err != nil {
		return router.ErrBadRequest(err)
	}

	username := trim(rq.PostForm.Get("Username"))
	password := trim(rq.PostForm.Get("Password"))

	user := repo.Users.FindByUsername(username)
	if user == nil {
		page.Errors = append(page.Errors, "Invalid username or password")
		return router.ExecuteErrorTemplate(w, "auth/login.html", page, http.StatusUnauthorized)
	}

	if !repo.Users.UserPasswordIs(user, password) {
		page.Errors = append(page.Errors, "Invalid username or password")
		return router.ExecuteErrorTemplate(w, "auth/login.html", page, http.StatusUnauthorized)
	}

	session, err := repo.Sessions.MakeForUser(user)
	if err != nil {
		return err
	}

	c := conf.Get()
	cookie := &http.Cookie{
		Name:    "session",
		Value:   session.Id,
		Path:    "/",
		Domain:  c.Session.Domain,
		Expires: time.Now().Add(time.Duration(c.Session.ExpireHours) * time.Hour),
		Secure:  c.Session.Https,
	}
	http.SetCookie(w, cookie)

	return router.Redirect(fmt.Sprintf("/userhome?Id=%d", user.Id), http.StatusFound)
}
