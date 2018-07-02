package api

import (
	"io"
	"log"
	"net/http"
	"strconv"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/fs"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/download", requestDownload)
}

type Download struct {
	Download *model.Download
	File     *model.File
}

func requestDownload(rq *http.Request) (apirouter.Handler, error) {
	download := repo.Downloads.Find(rq.URL.Query().Get("Code"))
	if download == nil {
		return nil, apirouter.ErrNotFound()
	}

	if download.Expired() {
		return nil, apirouter.ErrNotFound()
	}

	file := repo.Files.Find(download.FileHash)
	if file == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &Download{
		Download: download,
		File:     file,
	}, nil
}

func (page *Download) CanAccess(current *model.User) bool {
	return true
}

func (page *Download) HandleGet(w http.ResponseWriter) error {
	f, err := fs.GetFile(page.File.Hash)
	if err != nil {
		return err
	}
	defer f.Close()

	w.Header().Set("Content-Type", page.File.ContentType())
	w.Header().Set("Content-Disposition", `attachment; filename="`+page.File.Filename+`"`)
	w.Header().Set("Content-Length", strconv.FormatUint(page.File.Size, 10))
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")

	if _, err := io.Copy(w, f); err != nil {
		log.Printf("download stream error: %v", err)
	}

	return nil
}
