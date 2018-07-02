package main

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func uploads() error {
	now := time.Now()
	c := conf.Get()
	timeout := time.Duration(c.Cleanup.UploadTimeoutHours) * time.Hour
	uploads := repo.Uploads.FindAll()

	dbMap := make(map[string]*model.Upload)
	staleMap := make(map[string]*model.Upload)

	for _, upload := range uploads {
		dbMap[upload.Code] = upload
		if now.Sub(upload.Ctime) > timeout {
			staleMap[upload.Code] = upload
		}
	}

	// delete stale uploads from db

	for code, upload := range staleMap {
		if err := repo.Uploads.Delete(upload); err != nil {
			return err
		}
		delete(dbMap, code)
	}

	log.Printf("deleted %d stale uploads from db", len(staleMap))

	root := true
	return filepath.Walk(c.UploadDir(), func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if root {
			root = false
			return nil
		}
		if info.IsDir() {
			return filepath.SkipDir
		}

		code := filepath.Base(path)
		if upload := dbMap[code]; upload == nil {
			log.Printf("removing %s", path)
			return os.Remove(path)
		}

		return nil
	})
}
