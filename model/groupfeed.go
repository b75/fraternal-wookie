package model

import (
	"html/template"
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

func (f *GroupFeed) HtmlEscape() {
	f.Header = template.HTMLEscapeString(f.Header)
	f.Body = template.HTMLEscapeString(f.Body)
}

func (fs GroupFeeds) HtmlEscape() {
	for _, f := range fs {
		f.HtmlEscape()
	}
}
