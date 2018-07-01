package upload

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/fs"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/util"
)

func HandleUpload(upload *model.Upload) error {
	fname := filepath.Join(conf.Get().UploadDir(), upload.Code)

	info, err := os.Stat(fname)
	if err != nil {
		return err
	}
	if info.Mode()&os.ModeType != 0 {
		return fmt.Errorf("not a regular file: %s", fname)
	}
	if info.Size() != int64(upload.Size) {
		return fmt.Errorf("expecting file of size %d, got %d", upload.Size, info.Size())
	}

	hash, err := util.FileSha256SumHex(fname)
	if err != nil {
		return err
	}

	mime, charset, err := util.FileMimeCharset(fname)
	if err != nil {
		return err
	}

	if err := fs.StoreFile(hash, fname); err != nil {
		return err
	}

	file := &model.File{
		Hash:     hash,
		Filename: upload.Filename,
		Size:     upload.Size,
		Mime:     mime,
		Charset:  charset,
	}

	return repo.Files.InsertForUserId(file, upload.UserId)
}
