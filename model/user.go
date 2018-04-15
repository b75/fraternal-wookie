package model

import (
	"html/template"
)

type User struct {
	Id       int64
	Username string
	Email    string
}

type Users []*User

func (u *User) Is(other *User) bool {
	if u == nil || other == nil {
		return false
	}

	return u.Id == other.Id
}

func (u *User) HtmlEscape() {
	u.Username = template.HTMLEscapeString(u.Username)
	u.Email = template.HTMLEscapeString(u.Email)
}

func (us Users) Contain(user *User) bool {
	if user == nil {
		return false
	}

	for _, u := range us {
		if u.Id == user.Id {
			return true
		}
	}

	return false
}
