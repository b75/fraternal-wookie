package router

import (
	"bytes"
	"github.com/b75/fraternal-wookie/util"
	"html/template"
	"io"
	"log"
)

var tpls *template.Template

func LoadTemplates(dirname string) {
	var err error
	fmap := template.FuncMap{}

	tpls, err = util.LoadTemplates(dirname, fmap)
	if err != nil {
		panic(err)
	}
}

func ExecuteTemplate(w io.Writer, name string, data interface{}) error {
	b := &bytes.Buffer{}

	if err := tpls.ExecuteTemplate(b, name, data); err != nil {
		return err
	}

	_, err := io.Copy(w, b)
	if err != nil {
		log.Printf("tpl write error: %v", err)
	}

	return nil
}
