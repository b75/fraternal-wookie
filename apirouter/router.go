package apirouter

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/token"
)

const (
	notFoundJson            string = `{"Success":false,"Error":"not found"}`
	badRequestJson          string = `{"Success":false,"Error":"bad request"}`
	forbiddenJson           string = `{"Success":false,"Error":"forbidden"}`
	methodNotAllowedJson    string = `{"Success":false,"Error":"method not allowed"}`
	internalServerErrorJson string = `{"Success":false,"Error":"internal server error"}`
)

var registerMutex *sync.Mutex = &sync.Mutex{}

type Handler interface {
	CanAccess(*model.User) bool
}

type GetHandler interface {
	HandleGet(http.ResponseWriter) error
}

type PostHandler interface {
	HandlePost(http.ResponseWriter, *http.Request) error
}

var handlers map[string]func(*http.Request) (Handler, error) = make(map[string]func(*http.Request) (Handler, error))
var connectors map[string]func(http.ResponseWriter, *http.Request) = make(map[string]func(http.ResponseWriter, *http.Request))

func RegisterHandler(path string, handleFunc func(*http.Request) (Handler, error)) {
	registerMutex.Lock()
	defer registerMutex.Unlock()

	if handleFunc == nil {
		panic(fmt.Errorf("apirouter: nil handler func for path '%s'", path))
	}
	if !strings.HasPrefix(path, "/") {
		panic(fmt.Errorf("apirouter: path '%s' does not begin with /", path))
	}

	if _, ok := handlers[path]; ok {
		panic(fmt.Errorf("apirouter handler conflict: %s", path))
	}
	if _, ok := connectors[path]; ok {
		panic(fmt.Errorf("apirouter connector conflict: %s", path))
	}

	handlers[path] = handleFunc
	log.Printf("handler registered for path %s", path)
}

func RegisterConnector(path string, handleFunc func(http.ResponseWriter, *http.Request)) {
	registerMutex.Lock()
	defer registerMutex.Unlock()

	if handleFunc == nil {
		panic(fmt.Errorf("apirouter: nil connector for path '%s'", path))
	}
	if !strings.HasPrefix(path, "/") {
		panic(fmt.Errorf("apirouter: path '%s' does not begin with /", path))
	}

	if _, ok := handlers[path]; ok {
		panic(fmt.Errorf("apirouter handler conflict: %s", path))
	}
	if _, ok := connectors[path]; ok {
		panic(fmt.Errorf("apirouter connector conflict: %s", path))
	}

	connectors[path] = handleFunc
	log.Printf("connector registered for path %s", path)
}

func RootHandler(w http.ResponseWriter, rq *http.Request) {
	defer func() {
		if r := recover(); r != nil {
			internalServerError(w, fmt.Errorf("panic: %v", r))
		}
	}()

	log.Printf("%s %s", rq.Method, rq.URL.Path)

	if f, ok := connectors[rq.URL.Path]; ok {
		f(w, rq)
		return
	}

	switch rq.Method {
	case "GET":
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		corsHeaders(w)
		handleGet(w, rq)
	case "POST":
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		corsHeaders(w)
		handlePost(w, rq)
	case "OPTIONS":
		corsHeaders(w)
		w.WriteHeader(http.StatusOK)
	default:
		w.Header().Set("Content-Type", "application/json; charset=utf-8")
		methodNotAllowed(w)
	}
}

func corsHeaders(w http.ResponseWriter) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Add("Vary", "Origin")
	w.Header().Add("Vary", "Access-Control-Request-Method")
	w.Header().Add("Vary", "Access-Control-Request-Headers")
	w.Header().Add("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, Authorization")
	w.Header().Add("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
}

func handleGet(w http.ResponseWriter, rq *http.Request) {
	hf, ok := handlers[rq.URL.Path]
	if !ok {
		notFound(w)
		return
	}

	h, err := hf(rq)
	if err != nil {
		handleError(w, rq, err)
		return
	}

	if !h.CanAccess(token.Authenticate(rq)) {
		forbidden(w)
		return
	}

	gh, ok := h.(GetHandler)
	if !ok {
		methodNotAllowed(w)
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
		notFound(w)
		return
	}

	h, err := hf(rq)
	if err != nil {
		handleError(w, rq, err)
		return
	}

	if !h.CanAccess(token.Authenticate(rq)) {
		forbidden(w)
		return
	}

	ph, ok := h.(PostHandler)
	if !ok {
		methodNotAllowed(w)
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
		notFound(w)
	case *badRequestError:
		log.Printf("bad request error: %v", v.err)
		badRequest(w)
	default:
		internalServerError(w, v)
	}
}

func notFound(w http.ResponseWriter) {
	http.Error(w, notFoundJson, http.StatusNotFound)
}

func badRequest(w http.ResponseWriter) {
	http.Error(w, badRequestJson, http.StatusBadRequest)
}

func forbidden(w http.ResponseWriter) {
	http.Error(w, forbiddenJson, http.StatusForbidden)
}

func methodNotAllowed(w http.ResponseWriter) {
	http.Error(w, methodNotAllowedJson, http.StatusMethodNotAllowed)
}

func internalServerError(w http.ResponseWriter, err error) {
	log.Printf("internal server error: %v", err)
	http.Error(w, internalServerErrorJson, http.StatusInternalServerError)
}
