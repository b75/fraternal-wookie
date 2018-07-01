package repo

import (
	"database/sql"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/util"
)

type fileRepo struct {
	db *sql.DB
}

func (r *fileRepo) InsertForUserId(f *model.File, userId int64) (err error) {
	if !util.Sha256HexExp.MatchString(f.Hash) {
		return util.InvalidSha256HashError
	}

	var tx *sql.Tx
	tx, err = r.db.Begin()
	if err != nil {
		return
	}
	commit := false
	defer func() {
		var err2 error
		if commit {
			err2 = tx.Commit()
		} else {
			err2 = tx.Rollback()
		}
		if err == nil {
			err = err2
		}
	}()

	fileExists := false
	err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM file WHERE hash = $1 LIMIT 1)", f.Hash).Scan(&fileExists)
	if err != nil {
		return
	}

	fileAccessExists := false
	err = tx.QueryRow("SELECT EXISTS(SELECT 1 FROM file_access WHERE hash = $1 AND user_id = $2 LIMIT 1)", f.Hash, userId).Scan(&fileAccessExists)
	if err != nil {
		return
	}

	if !fileExists {
		_, err = tx.Exec("INSERT INTO file (hash, filename, size, mime, charset) VALUES ($1, $2, $3, $4, $5)", f.Hash, f.Filename, f.Size, f.Mime, f.Charset)
		if err != nil {
			return
		}
	}

	if !fileAccessExists {
		_, err = tx.Exec("INSERT INTO file_access (hash, user_id) VALUES ($1, $2)", f.Hash, userId)
		if err != nil {
			return
		}
	}

	commit = true
	return
}
