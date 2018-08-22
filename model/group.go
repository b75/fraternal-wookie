package model

import (
	"time"
)

type Groups []*Group

type Group struct {
	Id          int64
	Ctime       time.Time
	Name        string
	Description string
	Admin       int64
}
