package router

import (
	"bytes"
	"html/template"
	"io"
	"log"
	"net/http"
	"time"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/util"
)

var version int64 = time.Now().Unix()
var tpls *template.Template
var tplDir string
var ReloadTemplates bool

func LoadTemplates(dirname string) {
	tplDir = dirname
	var err error
	fmap := template.FuncMap{
		"V":        func() int64 { return version },
		"apiurl":   func() string { return conf.Get().Api.Url },
		"connpath": func() string { return conf.Get().Api.ConnectionPath },
		"datetime": func(t time.Time) string { return util.FormatDateTime(t) },
	}

	tpls, err = util.LoadTemplates(dirname, fmap)
	if err != nil {
		panic(err)
	}
}

func ExecuteTemplate(w http.ResponseWriter, name string, data interface{}) error {
	return executeTemplate(w, name, data, http.StatusOK)
}

func ExecuteErrorTemplate(w http.ResponseWriter, name string, data interface{}, status int) error {
	return executeTemplate(w, name, data, status)
}

func executeTemplate(w http.ResponseWriter, name string, data interface{}, status int) error {
	if ReloadTemplates {
		tpls = nil
		log.Print("reloading templates")
		LoadTemplates(tplDir)
	}

	b := &bytes.Buffer{}

	if err := tpls.ExecuteTemplate(b, name, data); err != nil {
		return err
	}

	w.WriteHeader(status)
	_, err := io.Copy(w, b)
	if err != nil {
		log.Printf("tpl write error: %v", err)
	}

	return nil
}
