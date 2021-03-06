package main

import (
	"flag"
	"log"
	"net/http"

	_ "github.com/b75/fraternal-wookie/api"
	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/repo"
)

var configFile string

func init() {
	flag.StringVar(&configFile, "c", "config.json", "Main config file")
}

func main() {
	flag.Parse()

	conf.Load(configFile)
	c := conf.Get()

	repo.Initialize(c.Db)

	http.HandleFunc("/", apirouter.RootHandler)

	log.Print("listening on 8081")

	// TODO tls
	log.Fatal(http.ListenAndServe(":8081", nil))
}
