package fs

import (
	"errors"
	"os"
	"path/filepath"

	"github.com/b75/fraternal-wookie/conf"
	"github.com/b75/fraternal-wookie/util"
)

var NotRegularFileError = errors.New("not regular file")

func fsPath(hash string) string {
	return filepath.Join(conf.Get().FsDir(), hash[0:2], hash[0:4], hash)
}

func StoreFile(hash, fname string) error {
	if !util.Sha256HexExp.MatchString(hash) {
		return util.InvalidSha256HashError
	}

	fsn := fsPath(hash)

	if info, err := os.Stat(fsn); err == nil {
		if info.Mode()&os.ModeType != 0 {
			return NotRegularFileError
		}
		return nil // file exists, presume everything is just swell
	} else {
		if !os.IsNotExist(err) {
			return err
		}
	}

	if err := os.MkdirAll(filepath.Dir(fsn), 0750); err != nil {
		return err
	}

	return os.Rename(fname, fsn)
}
