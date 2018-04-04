package api

import (
	"fmt"
	"log"
	"net/http"
	"strings"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/event"
	"github.com/b75/fraternal-wookie/token"
	"github.com/gorilla/websocket"
)

var broadcaster *event.Broadcaster

func init() {
	apirouter.RegisterConnector("/connect", connect)

	broadcaster = &event.Broadcaster{}
	broadcaster.Start()
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(rq *http.Request) bool {
		return true // TODO
	},
}

func connect(w http.ResponseWriter, rq *http.Request) {
	log.Printf("new websocket connection from %s", rq.RemoteAddr)
	c, err := upgrader.Upgrade(w, rq, nil)
	if err != nil {
		log.Printf("websocket upgrade error: %v", err)
		return
	}
	defer c.Close()

	closeChan := make(chan struct{}, 1)
	readChan := make(chan []byte)
	listener := &event.Listener{}
	listener.On(event.EventTypeHeartbeat, func(e event.Event) {
		if err := c.WriteMessage(1, []byte("heartbeat")); err != nil {
			log.Printf("websocket write error: %v", err)
		}
	})
	broadcaster.RegisterListener(listener)
	defer broadcaster.RemoveListener(listener)

	go func(rc chan<- []byte, cc chan<- struct{}) {
		for {
			mt, msg, err := c.ReadMessage()
			if err != nil {
				log.Printf("websocket read error: %v", err)
				cc <- struct{}{}
				break
			}
			if mt == 1 {
				rc <- msg
			}
		}
	}(readChan, closeChan)

connLoop:
	for {
		select {
		case <-closeChan:
			break connLoop
		case msg := <-readChan:
			log.Printf("websocket msg: %s", string(msg))
			if err := handleMessage(msg, listener); err != nil {
				if werr := c.WriteMessage(1, []byte(err.Error())); werr != nil {
					log.Printf("websocket write error: %v", werr)
				}
			}
		}
	}

	log.Printf("websocket connection closed from %s", rq.RemoteAddr)
}

func handleMessage(msg []byte, listener *event.Listener) error {
	parts := strings.Fields(string(msg))

	switch parts[0] {
	case "ping":
		if len(parts) > 1 {
			return fmt.Errorf("pong %s", strings.Join(parts[1:], " "))
		}
		return fmt.Errorf("pong")
	case "auth":
		if len(parts) < 3 {
			return fmt.Errorf("expecting: auth Bearer [TOKEN]")
		}
		tk, err := token.Parse([]byte(strings.Join(parts[1:], " ")))
		if err != nil {
			return err
		}
		if tk.User == nil {
			return fmt.Errorf("user not found")
		}

		// TODO expiry
		listener.User = tk.User
		return nil
	case "logout":
		listener.User = nil
		return nil
	case "subscribe":
		if len(parts) < 2 {
			return fmt.Errorf("expecting: subscribe [TYPE]")
		}
		return handleSubscribe(parts[1], parts[1:]...)
	default:
		return fmt.Errorf("unknown cmd '%s'", parts[0])
	}
}

func handleSubscribe(typ string, opts ...string) error {
	// TODO
	return nil
}
