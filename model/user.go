package model

type User struct {
	Username string
	Email    string
}

type Users []*User

func (u *User) Is(other *User) bool {
	if u == nil || other == nil {
		return false
	}

	return u.Username == other.Username
}

func (us Users) Contain(user *User) bool {
	if user == nil {
		return false
	}

	for _, u := range us {
		if u.Username == user.Username {
			return true
		}
	}

	return false
}
