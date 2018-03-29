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

	if err := r.db.QueryRow("SELECT id, ctime, user_id FROM session WHERE id = $1", id).Scan(&session.Id, &session.Ctime, &session.UserId); err != nil {
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
		Id:     string(key),
		UserId: user.Id,
	}

	if _, err := r.db.Exec("INSERT INTO session (id, user_id) VALUES($1, $2)", session.Id, session.UserId); err != nil {
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
