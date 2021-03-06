package model

import (
	"time"
)

type Uploads []*Upload

type Upload struct {
	Code     string
	Ctime    time.Time `json:"-"`
	Filename string
	UserId   int64 `json:"-"`
	Size     uint64
}
