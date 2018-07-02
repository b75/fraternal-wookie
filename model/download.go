package model

import (
	"time"

	"github.com/b75/fraternal-wookie/conf"
)

type Download struct {
	Code     string
	Ctime    time.Time `json:"-"`
	FileHash string    `json:"-"`
}

func (d *Download) HtmlEscape() {}

func (d *Download) Expired() bool {
	return time.Since(d.Ctime) > time.Duration(conf.Get().Api.Download.ExpireMinutes)*time.Minute
}
