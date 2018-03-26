package repo

import (
	"database/sql"
	_ "github.com/lib/pq"
	"log"
)

var Users *userRepo
var Sessions *sessionRepo
var Groups *groupRepo

var db *sql.DB

func Initialize(connStr string) {
	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		panic(err)
	}

	if err = db.Ping(); err != nil {
		panic(err)
	}
	log.Print("connected to db")

	Users = &userRepo{db: db}
	Sessions = &sessionRepo{db: db}
	Groups = &groupRepo{db: db}
}
