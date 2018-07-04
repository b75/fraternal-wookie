package model

import (
	"html/template"
	"net/url"
	"strconv"
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

type FileSearchParams struct {
	UserId int64
	Search string

	OrderBy string
	Limit   uint64
	Offset  uint64
}

type FileSearchResult struct {
	Params     *FileSearchParams
	TotalCount int64
	Result     Files
}

func (fs Files) HtmlEscape() {
	for _, f := range fs {
		f.HtmlEscape()
	}
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

func (p *FileSearchParams) FromQuery(query url.Values) error {
	userId, _ := strconv.ParseInt(query.Get("UserId"), 10, 64)
	limit, _ := strconv.ParseUint(query.Get("Limit"), 10, 64)
	offset, _ := strconv.ParseUint(query.Get("Offset"), 10, 64)
	search := query.Get("Search")
	if search != "" {
		search = "%" + search + "%"
	}

	p.UserId = userId
	p.Search = search
	p.OrderBy = query.Get("OrderBy")
	p.Limit = limit
	p.Offset = offset

	return nil
}

func (r *FileSearchResult) HtmlEscape() {
	r.Result.HtmlEscape()
}
