package repo

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"errors"
	"time"

	"github.com/b75/fraternal-wookie/model"
	"golang.org/x/crypto/bcrypt"
)

type userRepo struct {
	db *sql.DB
}

func (r *userRepo) FindByUsername(username string) *model.User {
	user := &model.User{}

	if err := r.db.QueryRow("SELECT username, email FROM wookie WHERE username = $1", username).Scan(&user.Username, &user.Email); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	return user
}

func (r *userRepo) FindBySession(id string) *model.User {
	user := &model.User{}

	// SELECT w.* FROM session s JOIN wookie w ON (s.username = w.username) WHERE s.id = '65383dd7692f3d3c021ad5114585d68b';
	if err := r.db.QueryRow("SELECT w.username, w.email FROM session s JOIN wookie w ON (s.username = w.username) WHERE s.id = $1", id).Scan(&user.Username, &user.Email); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	return user
}

func (r *userRepo) UserPasswordIs(user *model.User, password string) bool {
	if user == nil {
		return false
	}

	comp := ""
	if err := r.db.QueryRow("SELECT password FROM wookie WHERE username = $1", user.Username).Scan(&comp); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(comp), []byte(password))
	return err == nil
}

func (r *userRepo) MakeSession(user *model.User) (*model.Session, error) {
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
		Ctime:    time.Now(),
		Username: user.Username,
	}

	if _, err := r.db.Exec("INSERT INTO session VALUES($1, $2, $3)", session.Id, session.Ctime, session.Username); err != nil {
		return nil, err
	}

	return session, nil
}
