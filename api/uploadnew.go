package api

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/uploadnew", requestUploadNew)
}

type UploadNew struct {
	User *model.User
}

func requestUploadNew(rq *http.Request) (apirouter.Handler, error) {
	return &UploadNew{}, nil
}

func (page *UploadNew) CanAccess(current *model.User) bool {
	page.User = current
	return current != nil
}

func (page *UploadNew) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	p := &struct {
		Size     uint64
		Filename string
	}{}

	decoder := json.NewDecoder(rq.Body)
	if err := decoder.Decode(p); err != nil {
		return apirouter.ErrBadRequest(err)
	}
	p.Filename = strings.TrimSpace(p.Filename)

	if p.Size == 0 {
		return apirouter.ErrBadRequest(errors.New("expected file size must be gt 0"))
	}
	if p.Filename == "" {
		return apirouter.ErrBadRequest(errors.New("required: Filename"))
	}

	u := &model.Upload{
		Size:     p.Size,
		Filename: p.Filename,
		UserId:   page.User.Id,
	}

	if err := repo.Uploads.Insert(u); err != nil {
		return err
	}

	return apirouter.JsonResponse(w, u)
}
