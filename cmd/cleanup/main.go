package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"sort"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/repo"
)

var configFile string
var operation string

type Operation struct {
	Description string
	F           func() error
}

var opMap = map[string]*Operation{
	"uploads": &Operation{
		Description: "Cleanup uploads",
		F:           uploads,
	},
}

func init() {
	flag.StringVar(&configFile, "c", "config.json", "Config file")
	flag.StringVar(&operation, "o", "", "Cleanup operation")
}

func main() {
	ops := []string{}
	for k := range opMap {
		ops = append(ops, k)
	}
	sort.Strings(ops)

	flag.Usage = func() {
		fmt.Fprintf(os.Stderr, "Usage: %s\n", os.Args[0])
		flag.PrintDefaults()
		fmt.Fprintln(os.Stderr, "\nOperations:")
		for _, k := range ops {
			op := opMap[k]
			fmt.Fprintf(os.Stderr, "%s : %s\n", k, op.Description)
		}
	}
	flag.Parse()

	op := opMap[operation]
	if op == nil {
		fmt.Fprintf(os.Stderr, "no such operation: %s\n", operation)
		flag.Usage()
		os.Exit(1)
	}

	conf.Load(configFile)

	repo.Initialize(conf.Get().Db)

	log.Printf("running operation %s", operation)
	if err := op.F(); err == nil {
		log.Printf("operation %s completed successfully", operation)
	} else {
		log.Printf("operation %s failed: %v", err)
	}
}
