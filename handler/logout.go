package handler

import (
	"net/http"
	"time"

	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

func init() {
	router.RegisterHandler("/logout", requestLogout)
}

type Logout struct {
	Action string
}

func requestLogout(rq *http.Request) (router.Handler, error) {
	return &Logout{
		Action: rq.URL.Path,
	}, nil
}

func (page *Logout) CanAccess() bool {
	return true
}

func (page *Logout) HandleGet(w http.ResponseWriter) error {
	return router.ExecuteTemplate(w, "auth/logout.html", page)
}

func (page *Logout) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	if err := checkReferer(rq); err != nil {
		return router.ErrForbidden()
	}

	response := map[string]interface{}{
		"Success": true,
		"Msg":     "Logged out",
	}

	cookie, err := rq.Cookie("session")
	if err != nil {
		return router.JsonResponse(w, response)
	}

	if err = repo.Sessions.Delete(cookie.Value); err != nil {
		return err
	}
	cookie.Expires = time.Unix(0, 0)
	cookie.MaxAge = -1
	http.SetCookie(w, cookie)

	return router.JsonResponse(w, response)
}
