package repo

import (
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"errors"

	"github.com/b75/fraternal-wookie/model"
	"golang.org/x/crypto/bcrypt"
)

type userRepo struct {
	db *sql.DB
}

func (r *userRepo) Find(id int64) *model.User {
	user := &model.User{}

	if err := r.db.QueryRow("SELECT id, username, email FROM wookie WHERE id = $1", id).Scan(&user.Id, &user.Username, &user.Email); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	return user
}

func (r *userRepo) FindByUsername(username string) *model.User {
	user := &model.User{}

	if err := r.db.QueryRow("SELECT id, username, email FROM wookie WHERE username = $1", username).Scan(&user.Id, &user.Username, &user.Email); err != nil {
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
	if err := r.db.QueryRow("SELECT password FROM wookie WHERE id = $1", user.Id).Scan(&comp); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return false
	}

	err := bcrypt.CompareHashAndPassword([]byte(comp), []byte(password))
	return err == nil
}

func (r *userRepo) GenerateSecret(user *model.User) error {
	if user == nil {
		return errors.New("nil user")
	}

	b := make([]byte, 64)
	if _, err := rand.Read(b); err != nil {
		return err
	}

	secret := make([]byte, base64.StdEncoding.EncodedLen(len(b)))
	base64.StdEncoding.Encode(secret, b)

	_, err := r.db.Exec("UPDATE wookie SET secret = $1 WHERE id = $2", string(secret), user.Id)
	return err
}

func (r *userRepo) Secret(user *model.User) string {
	if user == nil {
		return ""
	}

	secret := ""
	if err := r.db.QueryRow("SELECT secret FROM wookie WHERE id = $1", user.Id).Scan(&secret); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return ""
	}

	return secret
}
