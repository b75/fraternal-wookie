package repo

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"

	"github.com/b75/fraternal-wookie/model"
)

type uploadRepo struct {
	db *sql.DB
}

func (r *uploadRepo) Find(code string) *model.Upload {
	upload := &model.Upload{}

	if err := r.db.QueryRow("SELECT code, ctime, filename, user_id, size FROM upload WHERE code = $1", code).Scan(&upload.Code, &upload.Ctime, &upload.Filename, &upload.UserId, &upload.Size); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	return upload
}

func (r *uploadRepo) FindAll() model.Uploads {
	uploads := model.Uploads{}

	rows, err := r.db.Query("SELECT code, ctime, filename, user_id, size FROM upload")
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		upload := &model.Upload{}
		if err = rows.Scan(
			&upload.Code,
			&upload.Ctime,
			&upload.Filename,
			&upload.UserId,
			&upload.Size,
		); err != nil {
			panic(err)
		}
		uploads = append(uploads, upload)
	}

	if err = rows.Err(); err != nil {
		panic(err)
	}

	return uploads
}

func (r *uploadRepo) Insert(u *model.Upload) error {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return err
	}

	enc := make([]byte, base64.URLEncoding.EncodedLen(len(b)))
	base64.URLEncoding.Encode(enc, b)
	u.Code = string(enc)

	_, err := r.db.Exec(
		"INSERT INTO upload (code, filename, user_id, size) VALUES ($1, $2, $3, $4)",
		u.Code,
		u.Filename,
		u.UserId,
		u.Size,
	)
	return err
}

func (r *uploadRepo) Delete(u *model.Upload) error {
	_, err := r.db.Exec("DELETE FROM upload WHERE code = $1", u.Code)
	return err
}
