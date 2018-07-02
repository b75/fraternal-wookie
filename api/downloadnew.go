package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/downloadnew", requestDownloadNew)
}

type DownloadNew struct {
	File *model.File
}

func requestDownloadNew(rq *http.Request) (apirouter.Handler, error) {
	file := repo.Files.Find(rq.URL.Query().Get("Hash"))
	if file == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &DownloadNew{
		File: file,
	}, nil
}

func (page *DownloadNew) CanAccess(current *model.User) bool {
	return repo.Files.CanAccess(page.File, current)
}

func (page *DownloadNew) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	dl := &model.Download{
		FileHash: page.File.Hash,
	}

	if err := repo.Downloads.Insert(dl); err != nil {
		return err
	}

	return apirouter.JsonResponse(w, dl)
}
