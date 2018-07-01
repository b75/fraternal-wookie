package api

import (
	"log"
	"strconv"
)

func parseId(s string) int64 {
	id, err := strconv.ParseInt(s, 10, 64)
	if err != nil {
		return 0
	}
	return id
}

// one does not simply crash the whole server on some random panic
func goSafe(f func()) {
	go func() {
		defer func() {
			if r := recover(); r != nil {
				log.Printf("panic: %v", r)
			}
		}()
		f()
	}()
}
