package model

import (
	"time"

	"github.com/b75/fraternal-wookie/conf"
)

type Session struct {
	Id     string
	Ctime  time.Time
	UserId int64
}

func (s *Session) Expired() bool {
	return time.Since(s.Ctime) > time.Duration(conf.Get().Session.ExpireHours)*time.Hour
}
