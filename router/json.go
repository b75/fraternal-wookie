package router

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

type JsonForm map[string]string

func (jf JsonForm) Get(k string) string {
	if val, ok := jf[k]; ok {
		return strings.TrimSpace(val)
	}
	return ""
}

type jsonField struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

func JsonResponse(w http.ResponseWriter, data interface{}) error {
	b, err := json.Marshal(data)
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	if _, err = w.Write(b); err != nil {
		log.Printf("json write error: %v", err)
	}

	return nil
}

func ParseJsonForm(rq *http.Request) (JsonForm, error) {
	defer rq.Body.Close()

	fields := []jsonField{}
	decoder := json.NewDecoder(rq.Body)
	if err := decoder.Decode(&fields); err != nil {
		return nil, err
	}

	form := JsonForm{}
	for _, field := range fields {
		form[field.Name] = field.Value
	}

	return form, nil
}
