package util

import (
	"bytes"
	"errors"
	"fmt"
	"html/template"
	"io/ioutil"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"
)

const DateTimeFormat = "2006-01-02 15:04:05"

const Month time.Duration = time.Duration(30 * 24 * time.Hour)

const (
	KiloByte = 1024
	MegaByte = 1024 * KiloByte
	GigaByte = 1024 * MegaByte
)

var Sha256HexExp *regexp.Regexp
var InvalidSha256HashError = errors.New("invalid sha256 hash")

func init() {
	Sha256HexExp = regexp.MustCompile(`^[0-9a-f]{64}$`)
}

func LoadTemplates(tplRoot string, fmap template.FuncMap) (*template.Template, error) {
	files := []string{}
	walk := func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if info.IsDir() {
			return nil
		}

		if strings.HasSuffix(info.Name(), ".html") {
			files = append(files, path)
		}
		return nil
	}

	err := filepath.Walk(tplRoot, walk)
	if err != nil {
		return nil, err
	}

	if len(files) == 0 {
		return nil, fmt.Errorf("no .html templates found in %s", tplRoot)
	}

	tpls := template.New("").Funcs(fmap)

	for _, f := range files {
		data, err := ioutil.ReadFile(f)
		if err != nil {
			return nil, err
		}

		name := strings.TrimPrefix(strings.TrimPrefix(f, tplRoot), "/")
		log.Printf("parsing tpl %s", name)
		_, err = tpls.New(name).Parse(string(data))
		if err != nil {
			return nil, err
		}
	}

	return tpls, nil
}

func FormatDateTime(t time.Time) string {
	return t.In(time.Local).Format(DateTimeFormat)
}

func FileSha256SumHex(fname string) (string, error) {
	cmd := exec.Command("sha256sum", fname)

	outb := &bytes.Buffer{}
	errb := &bytes.Buffer{}

	cmd.Stdout = outb
	cmd.Stderr = errb

	if err := cmd.Run(); err != nil {
		return "", err
	}

	if errb.Len() != 0 {
		log.Printf("sha256sum:\n%s", errb.String())
	}

	parts := strings.Fields(outb.String())

	return parts[0], nil
}

func FileMimeCharset(fname string) (mime, charset string, err error) {
	cmd := exec.Command("file", "-ib", fname)

	outb := &bytes.Buffer{}
	errb := &bytes.Buffer{}

	cmd.Stdout = outb
	cmd.Stderr = errb

	if err = cmd.Run(); err != nil {
		return
	}

	if errb.Len() != 0 {
		log.Printf("file -ib:\n%s", errb.String())
	}

	parts := strings.SplitN(outb.String(), ";", 2)

	if len(parts) != 2 {
		err = fmt.Errorf("file -ib output contains no semicolon: %s", outb.String())
		return
	}

	mime = strings.TrimSpace(parts[0])
	charset = strings.TrimPrefix(strings.TrimSpace(parts[1]), "charset=")

	return
}

func FormatFileSize(size uint64) string {
	f := float64(size)

	if size < KiloByte {
		return fmt.Sprintf("%d B", size)
	} else if size < MegaByte {
		f /= KiloByte
		return strconv.FormatFloat(f, 'f', 2, 64) + " kB"
	} else if size < GigaByte {
		f /= MegaByte
		return strconv.FormatFloat(f, 'f', 2, 64) + " MB"
	} else {
		f /= GigaByte
		return strconv.FormatFloat(f, 'f', 2, 64) + " GB"
	}
}
