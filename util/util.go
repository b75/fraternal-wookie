package util

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"os"
	"path/filepath"
	"strings"
)

func LoadTemplates(tplRoot string, fmap template.FuncMap) (*template.Template, error) {
	files := []string{}
	walk := func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		if strings.HasSuffix(info.Name(), ".html") {
			files = append(files, path)
		}
		return nil
	}

	err := filepath.Walk(tplRoot, walk)
	if err != nil {
		return nil, err
	}

	if len(files) == 0 {
		return nil, fmt.Errorf("no .html templates found in %s", tplRoot)
	}

	tpls := template.New("").Funcs(fmap)

	for _, f := range files {
		data, err := ioutil.ReadFile(f)
		if err != nil {
			return nil, err
		}

		name := strings.TrimPrefix(strings.TrimPrefix(f, tplRoot), "/")
		log.Printf("parsing tpl %s", name)
		_, err = tpls.New(name).Parse(string(data))
		if err != nil {
			return nil, err
		}
	}

	return tpls, nil
}
