package repo

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/model"
)

type sessionRepo struct {
	db *sql.DB
}

func (r *sessionRepo) Find(id string) *model.Session {
	session := &model.Session{}

	if err := r.db.QueryRow("SELECT id, ctime, username FROM session WHERE id = $1", id).Scan(&session.Id, &session.Ctime, &session.Username); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	return session
}

func (r *sessionRepo) MakeForUser(user *model.User) (*model.Session, error) {
	if user == nil {
		return nil, errors.New("nil user")
	}

	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return nil, err
	}

	key := make([]byte, hex.EncodedLen(len(b)))
	hex.Encode(key, b)

	session := &model.Session{
		Id:       string(key),
		Username: user.Username,
	}

	if _, err := r.db.Exec("INSERT INTO session (id, username) VALUES($1, $2)", session.Id, session.Username); err != nil {
		return nil, err
	}

	return session, nil
}

func (r *sessionRepo) Delete(id string) error {
	_, err := r.db.Exec("DELETE FROM session WHERE id = $1", id)
	return err
}

func (r *sessionRepo) DeleteExpired() error {
	c := conf.Get()
	before := time.Now().Add(-time.Duration(c.Session.ExpireHours) * time.Hour)
	_, err := r.db.Exec("DELETE FROM session WHERE ctime < $1", before)
	return err
}
