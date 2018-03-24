package conf

import (
	"encoding/json"
	"errors"
	"os"
	"sync"
)

var ErrNotLoaded = errors.New("config not loaded")

var lock *sync.RWMutex = &sync.RWMutex{}

type Config struct {
	BaseDir string
}

func (c *Config) StaticDir() string {
	return c.BaseDir + "/static"
}

func (c *Config) TplDir() string {
	return c.BaseDir + "/tpl"
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
