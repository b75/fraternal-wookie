package main

import (
	"flag"
	"log"
	"net/http"

	"github.com/b75/fraternal-wookie/conf"
	_ "github.com/b75/fraternal-wookie/handler"
	"github.com/b75/fraternal-wookie/repo"
	"github.com/b75/fraternal-wookie/router"
)

var configFile string

func init() {
	flag.StringVar(&configFile, "c", "config.json", "Main config json file")
}

func main() {
	flag.Parse()

	conf.Load(configFile)
	c := conf.Get()

	router.LoadTemplates(c.TplDir())
	router.ReloadTemplates = c.ReloadTemplates
	repo.Initialize(c.Db)

	fs := http.FileServer(http.Dir(c.StaticDir()))
	http.Handle("/assets/", http.StripPrefix("/assets/", fs))

	http.HandleFunc("/", router.RootHandler)

	log.Print("listening on 8080")

	log.Fatal(http.ListenAndServe(":8080", nil))
}
