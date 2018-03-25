package repo

import (
	"database/sql"

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
