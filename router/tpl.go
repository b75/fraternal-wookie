package router

import (
	"bytes"
	"github.com/b75/fraternal-wookie/util"
	"html/template"
	"io"
	"log"
	"net/http"
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

func ExecuteTemplate(w http.ResponseWriter, name string, data interface{}) error {
	return executeTemplate(w, name, data, http.StatusOK)
}

func ExecuteErrorTemplate(w http.ResponseWriter, name string, data interface{}, status int) error {
	return executeTemplate(w, name, data, status)
}

func executeTemplate(w http.ResponseWriter, name string, data interface{}, status int) error {
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
