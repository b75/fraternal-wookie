package model

type User struct {
	Username string
	Email    string
}

func (u *User) Is(other *User) bool {
	if u == nil || other == nil {
		return false
	}

	return u.Username == other.Username
}
