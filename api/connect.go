package api

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/event"
	"github.com/b75/fraternal-wookie/token"
	"github.com/b75/fraternal-wookie/upload"
	"github.com/gorilla/websocket"
)

var broadcaster *event.Broadcaster

func init() {
	apirouter.RegisterConnector("/connect", connect)

	broadcaster = &event.Broadcaster{}
	broadcaster.Start()

	upload.Broadcaster = broadcaster
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
	pongChan := make(chan string)
	listener := &event.Listener{}
	broadcaster.RegisterListener(listener)
	defer broadcaster.RemoveListener(listener)

	if err = c.SetReadDeadline(time.Now().Add(time.Minute)); err != nil {
		panic(err)
	}
	c.SetPongHandler(func(data string) error {
		pongChan <- data
		return nil
	})
	pingTicker := time.NewTicker(15 * time.Second)
	defer pingTicker.Stop()

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
			handleMessage(msg, c, listener)
		case <-pongChan:
			if err := c.SetReadDeadline(time.Now().Add(time.Minute)); err != nil {
				panic(err)
			}
		case <-pingTicker.C:
			if err := c.WriteMessage(websocket.PingMessage, nil); err != nil {
				log.Printf("websocket error writing ping message: %v", err)
			}
		}
	}

	log.Printf("websocket connection closed from %s", rq.RemoteAddr)
}

func handleWrite(c *websocket.Conn, msg string) {
	if err := c.WriteMessage(1, []byte(msg)); err != nil {
		log.Printf("websocket write error: %v", err)
	}
}

func handleMessage(msg []byte, c *websocket.Conn, listener *event.Listener) {
	parts := strings.Fields(string(msg))

	switch parts[0] {
	case "ping":
		if len(parts) > 1 {
			handleWrite(c, fmt.Sprintf("pong %s", strings.Join(parts[1:], " ")))
			return
		}
		handleWrite(c, "pong")
	case "time":
		handleWrite(c, fmt.Sprintf("%d", time.Now().Unix()))
	case "auth":
		if len(parts) < 3 {
			handleWrite(c, "expecting: auth Bearer [TOKEN]")
			return
		}
		tk, err := token.Parse([]byte(strings.Join(parts[1:], " ")))
		if err != nil {
			handleWrite(c, err.Error())
			return
		}
		listener.Token = tk
		subscribe(c, listener)
	case "logout":
		listener.Token = nil
	default:
		handleWrite(c, fmt.Sprintf("unknown cmd '%s'", parts[0]))
	}
}

func subscribe(c *websocket.Conn, listener *event.Listener) {
	listener.On(event.EventTypeHeartbeat, func(e event.Event) {
		handleWrite(c, "heartbeat")
	}).On(event.EventTypeTokenExpired, func(e event.Event) {
		handleWrite(c, "expired")
	}).On(event.EventTypeNewGroupMessage, func(e event.Event) {
		ev, ok := e.(*event.NewGroupMessageEvent)
		if !ok {
			return
		}
		handleWrite(c, fmt.Sprintf("new-group-message %d", ev.Group.Id))
	}).On(event.EventTypeNewFileAccess, func(e event.Event) {
		ev, ok := e.(*event.NewFileAccessEvent)
		if !ok {
			return
		}
		handleWrite(c, fmt.Sprintf("new-file-access %d", ev.UserId))
	})
}
