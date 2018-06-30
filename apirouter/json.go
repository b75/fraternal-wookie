package apirouter

import (
	"encoding/json"
	"log"
	"net/http"
)

type HtmlEscaper interface {
	HtmlEscape()
}

func JsonResponse(w http.ResponseWriter, data HtmlEscaper) error {
	if data != nil {
		data.HtmlEscape()
	}
	response := map[string]interface{}{
		"Success": true,
		"Result":  data,
	}
	return jsonResponse(w, response, http.StatusOK)
}

func JsonErrorResponse(w http.ResponseWriter, err error, status int) error {
	response := map[string]interface{}{
		"Success": false,
		"Error":   err.Error(),
	}
	return jsonResponse(w, response, status)
}

func jsonResponse(w http.ResponseWriter, response interface{}, status int) error {
	b, err := json.Marshal(response)
	if err != nil {
		return err
	}

	w.WriteHeader(status)
	if _, err = w.Write(b); err != nil {
		log.Printf("response write error: %v", err)
	}

	return nil
}
