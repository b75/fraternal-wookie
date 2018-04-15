package model

import (
	"html/template"
	"time"
)

type GroupMessages []*GroupMessage

type GroupMessage struct {
	Id      int64
	Ctime   time.Time
	GroupId int64
	UserId  int64
	Message string
}

func (m *GroupMessage) HtmlEscape() {
	m.Message = template.HTMLEscapeString(m.Message)
}

type GroupMessageViews []*GroupMessageView

type GroupMessageView struct {
	Id       int64
	GroupId  int64
	UserId   int64
	Ctime    time.Time
	Message  string
	Username string
}

func (v *GroupMessageView) HtmlEscape() {
	v.Message = template.HTMLEscapeString(v.Message)
	v.Username = template.HTMLEscapeString(v.Username)
}

func (vs GroupMessageViews) HtmlEscape() {
	for _, v := range vs {
		v.HtmlEscape()
	}
}
