package model

import (
	"html/template"
	"time"
)

type Files []*File

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

func (f *File) ContentType() string {
	mime := "application/octet-stream"
	charset := "binary"

	if f.Mime != "" {
		mime = f.Mime
	}
	if f.Charset != "" {
		charset = f.Charset
	}

	return mime + "; charset=" + charset
}
