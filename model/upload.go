package model

import (
	"html/template"
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

func (u *Upload) HtmlEscape() {
	u.Filename = template.HTMLEscapeString(u.Filename)
}
