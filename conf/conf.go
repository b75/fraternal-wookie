package conf

import (
	"encoding/json"
	"errors"
	"os"
	"path/filepath"
	"sync"
)

var ErrNotLoaded = errors.New("config not loaded")

var lock *sync.RWMutex = &sync.RWMutex{}

type Config struct {
	BaseDir string
	DataDir string
	Db      string
	Session SessionConfig
	Api     ApiConfig
	Debug   DebugConfig
}

type SessionConfig struct {
	Https            bool
	Domain           string
	ExpireHours      uint
	AllowedReferrers []string
}

type ApiConfig struct {
	Url            string
	ConnectionPath string
	Secret         string
	AuthIssuer     string
	AuthAudience   string
	Expiry         uint64
	Download       DownloadConfig
}

type DebugConfig struct {
	ReloadTemplates bool
}

type DownloadConfig struct {
	ExpireMinutes uint
}

func (c *Config) StaticDir() string {
	return filepath.Join(c.BaseDir, "static")
}

func (c *Config) TplDir() string {
	return filepath.Join(c.BaseDir, "tpl")
}

func (c *Config) UploadDir() string {
	return filepath.Join(c.DataDir, "upload")
}

func (c *Config) FsDir() string {
	return filepath.Join(c.DataDir, "fs")
}

var current *Config

func Load(fname string) {
	lock.Lock()
	defer lock.Unlock()

	current = &Config{}

	f, err := os.Open(fname)
	if err != nil {
		current = nil
		panic(err)
	}
	defer f.Close()

	decoder := json.NewDecoder(f)

	if err = decoder.Decode(current); err != nil {
		current = nil
		panic(err)
	}

	if err = check(); err != nil {
		current = nil
		panic(err)
	}
}

// NOTE would be safer to pass copies but let's avoid unnecessary allocs
func Get() *Config {
	lock.RLock()
	defer lock.RUnlock()

	if current == nil {
		panic(ErrNotLoaded)
	}

	return current
}

func check() error {
	type check struct {
		ok      bool
		failmsg string
	}

	checks := []check{
		check{
			ok:      current.BaseDir != "",
			failmsg: "Config.BaseDir not defined",
		},
		check{
			ok:      current.DataDir != "",
			failmsg: "Config.DataDir not defined",
		},
		check{
			ok:      current.Db != "",
			failmsg: "Config.Db not defined",
		},
		// session
		check{
			ok:      current.Session.Domain != "",
			failmsg: "Config.Session.Domain not defined",
		},
		check{
			ok:      current.Session.ExpireHours != 0,
			failmsg: "Config.Session.ExpireHours is 0",
		},
		check{
			ok:      len(current.Session.AllowedReferrers) != 0,
			failmsg: "Config.Session.AllowedReferrers is empty",
		},
		// api
		check{
			ok:      current.Api.Url != "",
			failmsg: "Config.Api.Url not defined",
		},
		check{
			ok:      current.Api.ConnectionPath != "",
			failmsg: "Config.Api.ConnectionPath not defined",
		},
		check{
			ok:      current.Api.Secret != "",
			failmsg: "Config.Api.Secret not defined",
		},
		check{
			ok:      current.Api.AuthIssuer != "",
			failmsg: "Config.Api.AuthIssuer not defined",
		},
		check{
			ok:      current.Api.AuthAudience != "",
			failmsg: "Config.Api.AuthAudience not defined",
		},
		check{
			ok:      current.Api.Expiry != 0,
			failmsg: "Config.Api.Expiry is 0",
		},
		check{
			ok:      current.Api.Download.ExpireMinutes != 0,
			failmsg: "Config.Api.Download.ExpireMinutes is 0",
		},
	}

	for _, chk := range checks {
		if !chk.ok {
			return errors.New(chk.failmsg)
		}
	}

	return nil
}
