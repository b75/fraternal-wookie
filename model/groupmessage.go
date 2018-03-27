package model

import (
	"time"
)

type GroupMessages []*GroupMessage

type GroupMessage struct {
	Id       int64
	GroupId  int64
	Username string
	Ctime    time.Time
	Message  string
}
