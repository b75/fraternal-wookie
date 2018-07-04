package repo

import (
	"database/sql"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/util"
)

type fileRepo struct {
	db *sql.DB
}

func (r *fileRepo) Find(hash string) *model.File {
	file := &model.File{}

	if err := r.db.QueryRow("SELECT hash, ctime, filename, size, mime, charset FROM file WHERE hash = $1", hash).Scan(
		&file.Hash,
		&file.Ctime,
		&file.Filename,
		&file.Size,
		&file.Mime,
		&file.Charset,
	); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	return file
}

func (r *fileRepo) Search(params *model.FileSearchParams) (model.Files, int64) {
	b := &util.PgQueryBuilder{}

	b.Select("COUNT(*)").From("file_access a JOIN file f ON (a.hash = f.hash)")

	if params.UserId != 0 {
		b.Where("a.user_id = ?", params.UserId)
	}
	if params.Search != "" {
		b.Where("f.filename ILIKE ? OR f.mime ILIKE ?", params.Search, params.Search)
	}

	var count int64
	if err := r.db.QueryRow(b.Sql(), b.Args()...).Scan(&count); err != nil {
		panic(err)
	}

	b.Select("f.hash, a.ctime, f.filename, f.size, f.mime, f.charset")
	switch params.OrderBy {
	case "Filename":
		b.OrderBy("f.filename")
	case "!Filename":
		b.OrderBy("f.filename DESC")
	case "Size":
		b.OrderBy("f.size")
	case "!Size":
		b.OrderBy("f.size DESC")
	}
	b.Limit(params.Limit).Offset(params.Offset)

	rows, err := r.db.Query(b.Sql(), b.Args()...)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	files := model.Files{}
	for rows.Next() {
		file := &model.File{}
		if err := rows.Scan(
			&file.Hash,
			&file.Ctime,
			&file.Filename,
			&file.Size,
			&file.Mime,
			&file.Charset,
		); err != nil {
			panic(err)
		}
		files = append(files, file)
	}

	if err = rows.Err(); err != nil {
		panic(err)
	}

	return files, count
}

func (r *fileRepo) CanAccess(file *model.File, user *model.User) bool {
	if file == nil || user == nil {
		return false
	}
	exists := false
	if err := r.db.QueryRow("SELECT EXISTS(SELECT 1 FROM file_access WHERE hash = $1 AND user_id = $2 LIMIT 1)", file.Hash, user.Id).Scan(&exists); err != nil {
		panic(err)
	}

	return exists
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
