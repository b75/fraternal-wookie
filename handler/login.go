package handler

import (
	"fmt"
	"net/http"

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

	session, err := repo.Users.MakeSession(user)
	if err != nil {
		return err
	}

	cookie := &http.Cookie{
		Name:  "session",
		Value: session.Id,
	}
	http.SetCookie(w, cookie)

	http.Redirect(w, rq, fmt.Sprintf("/home?Username=%s", user.Username), http.StatusFound)
	return nil
}
