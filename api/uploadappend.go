package api

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/upload"
)

func init() {
	apirouter.RegisterHandler("/uploadappend", requestUploadAppend)
}

type UploadAppend struct {
	User   *model.User
	Upload *model.Upload
}

func requestUploadAppend(rq *http.Request) (apirouter.Handler, error) {
	upload := repo.Uploads.Find(rq.URL.Query().Get("Code"))
	if upload == nil {
		return nil, apirouter.ErrNotFound()
	}

	return &UploadAppend{
		Upload: upload,
	}, nil
}

func (page *UploadAppend) CanAccess(current *model.User) bool {
	page.User = current
	return current.HasId(page.Upload.UserId)
}

func (page *UploadAppend) HandlePost(w http.ResponseWriter, rq *http.Request) error {
	fname := filepath.Join(conf.Get().UploadDir(), page.Upload.Code)

	// TODO block concurrent access

	var size int64
	info, err := os.Stat(fname)
	if err == nil {
		if info.Mode()&os.ModeType != 0 {
			return fmt.Errorf("%s is not a regular file", fname)
		}
		size = info.Size()
	} else {
		if !os.IsNotExist(err) {
			return err
		}
	}

	available := int64(page.Upload.Size) - size
	if available <= 0 {
		return apirouter.ErrBadRequest(fmt.Errorf("%s upload already finished"))
	}

	f, err := os.OpenFile(fname, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644)
	if err != nil {
		return err
	}

	n, err := io.CopyN(f, rq.Body, available)
	if err != nil && err != io.EOF {
		f.Close()
		return err
	}

	if err = f.Close(); err != nil {
		return err
	}

	if available-n <= 0 { // should be always >= 0
		goSafe(func() {
			if err := upload.HandleUpload(page.Upload); err != nil {
				log.Printf("upload.HandleUpload failed: %v", err)
			}
		})
	}

	return apirouter.JsonResponse(w, nil)
}
