package model

import (
	"time"
)

type GroupMessages []*GroupMessage

type GroupMessage struct {
	Id      int64
	GroupId int64
	UserId  int64
	Ctime   time.Time
	Message string
}
