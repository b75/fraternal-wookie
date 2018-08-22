package model

import (
	"time"
)

type GroupFeeds []*GroupFeed

type GroupFeed struct {
	Id      int64
	Ctime   time.Time
	GroupId int64
	UserId  int64
	Header  string
	Body    string
}
