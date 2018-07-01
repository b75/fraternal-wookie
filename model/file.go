package model

import (
	"html/template"
	"time"
)

type File struct {
	Hash     string
	Ctime    time.Time `json:"-"`
	Filename string
	Size     uint64
	Mime     string
	Charset  string
}

func (f *File) HtmlEscape() {
	f.Filename = template.HTMLEscapeString(f.Filename)
}
