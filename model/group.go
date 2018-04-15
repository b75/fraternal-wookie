package model

import (
	"html/template"
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

func (g *Group) HtmlEscape() {
	g.Name = template.HTMLEscapeString(g.Name)
	g.Description = template.HTMLEscapeString(g.Description)
}
