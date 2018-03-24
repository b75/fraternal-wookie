package model

import (
	"time"
)

type Session struct {
	Id       string
	Ctime    time.Time
	Username string
}
