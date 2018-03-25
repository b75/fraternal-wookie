package model

import (
	"time"

	"github.com/b75/fraternal-wookie/conf"
)

var expireHours uint

type Session struct {
	Id       string
	Ctime    time.Time
	Username string
}

func (s *Session) Expired() bool {
	if expireHours == 0 {
		expireHours = conf.Get().Session.ExpireHours
	}

	return time.Since(s.Ctime) > time.Duration(expireHours)*time.Hour
}
