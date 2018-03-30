package router

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
)

var registerMutex *sync.Mutex = &sync.Mutex{}

type Handler interface {
	CanAccess() bool
}

type GetHandler interface {
	HandleGet(http.ResponseWriter) error
}

type PostHandler interface {
	HandlePost(http.ResponseWriter, *http.Request) error
}

var handlers map[string]func(*http.Request) (Handler, error) = make(map[string]func(*http.Request) (Handler, error))

func RegisterHandler(path string, handleFunc func(*http.Request) (Handler, error)) {
	registerMutex.Lock()
	defer registerMutex.Unlock()

	if handleFunc == nil {
		panic(fmt.Errorf("router: nil handler func for path %s", path))
	}
	if !strings.HasPrefix(path, "/") {
		panic(fmt.Errorf("router: path '%s' does not begin with /", path))
	}

	if _, ok := handlers[path]; ok {
		panic(fmt.Errorf("router path conflict: %s", path))
	}

	handlers[path] = handleFunc
	log.Printf("handler registered for path %s", path)
}

func RootHandler(w http.ResponseWriter, rq *http.Request) {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("recover: %v", r)
			http.Error(w, "internal server error", http.StatusInternalServerError)
		}
	}()
	switch rq.Method {
	case "GET":
		handleGet(w, rq)
	case "POST":
		handlePost(w, rq)
	default:
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
	}
}

func handleGet(w http.ResponseWriter, rq *http.Request) {
	hf, ok := handlers[rq.URL.Path]
	if !ok {
		http.NotFound(w, rq)
		return
	}

	h, err := hf(rq)
	if err != nil {
		handleError(w, rq, err)
		return
	}

	if !h.CanAccess() {
		handleForbidden(w)
		return
	}

	gh, ok := h.(GetHandler)
	if !ok {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err = gh.HandleGet(w); err != nil {
		handleError(w, rq, err)
		return
	}
}

func handlePost(w http.ResponseWriter, rq *http.Request) {
	hf, ok := handlers[rq.URL.Path]
	if !ok {
		http.NotFound(w, rq)
		return
	}

	h, err := hf(rq)
	if err != nil {
		handleError(w, rq, err)
		return
	}

	if !h.CanAccess() {
		handleForbidden(w)
		return
	}

	ph, ok := h.(PostHandler)
	if !ok {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if err = ph.HandlePost(w, rq); err != nil {
		handleError(w, rq, err)
		return
	}
}

func handleError(w http.ResponseWriter, rq *http.Request, err error) {
	switch v := err.(type) {
	case *notFoundError:
		http.Error(w, "not found", http.StatusNotFound)
	case *badRequestError:
		log.Printf("bad request error: %v", v.err)
		http.Error(w, "bad request", http.StatusBadRequest)
	case *redirectError:
		http.Redirect(w, rq, v.url, v.status)
	default:
		log.Printf("internal server error: %v", v)
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}
}

func handleForbidden(w http.ResponseWriter) {
	if err := ExecuteErrorTemplate(w, "auth/forbidden.html", nil, http.StatusForbidden); err != nil {
		log.Printf("internal server error: %v", err)
		http.Error(w, "internal server error", http.StatusInternalServerError)
	}
}
