package repo

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"

	"github.com/b75/fraternal-wookie/model"
)

type downloadRepo struct {
	db *sql.DB
}

func (r *downloadRepo) Find(code string) *model.Download {
	download := &model.Download{}

	if err := r.db.QueryRow("SELECT code, ctime, file_hash FROM download WHERE code = $1", code).Scan(&download.Code, &download.Ctime, &download.FileHash); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	r.Delete(download)
	return download
}

func (r *downloadRepo) Delete(dl *model.Download) error {
	_, err := r.db.Exec("DELETE FROM download WHERE code = $1", dl.Code)
	return err
}

func (r *downloadRepo) Insert(dl *model.Download) error {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return err
	}

	enc := make([]byte, base64.URLEncoding.EncodedLen(len(b)))
	base64.URLEncoding.Encode(enc, b)
	dl.Code = string(enc)

	_, err := r.db.Exec(
		"INSERT INTO download (code, file_hash) VALUES ($1, $2)",
		dl.Code,
		dl.FileHash,
	)
	return err
}
