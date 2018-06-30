package event

import (
	"log"
	"runtime"
	"sync"
	"time"

	"github.com/b75/fraternal-wookie/token"
)

const (
	EventBufSize = 128
)

// TODO Listeners are kinda racy atm
type Listener struct {
	id        uint64
	callbacks map[uint64]func(e Event)
	Token     *token.WebToken
}

func (l *Listener) On(typ uint64, f func(Event)) *Listener {
	if l.callbacks == nil {
		l.callbacks = make(map[uint64]func(e Event))
	}

	l.callbacks[typ] = f
	return l
}

type Broadcaster struct {
	doneChan             chan struct{}
	registerListenerChan chan *Listener
	removeListenerChan   chan *Listener
	eventChan            chan Event
	listeners            map[uint64]*Listener
	serial               uint64
	init                 sync.Once
}

func (b *Broadcaster) Start() {
	b.init.Do(func() {
		b.doneChan = make(chan struct{})
		b.registerListenerChan = make(chan *Listener)
		b.removeListenerChan = make(chan *Listener)
		b.eventChan = make(chan Event, EventBufSize)
		b.listeners = make(map[uint64]*Listener)
		b.serial = 1

		go b.run()
	})
}

func (b *Broadcaster) Stop() {
	b.doneChan <- struct{}{}
}

func (b *Broadcaster) RegisterListener(l *Listener) {
	if l.id != 0 {
		return
	}
	b.registerListenerChan <- l
}

func (b *Broadcaster) RemoveListener(l *Listener) {
	if l.id == 0 {
		return
	}
	b.removeListenerChan <- l
}

func (b *Broadcaster) Event(e Event) {
	b.eventChan <- e
}

func (b *Broadcaster) run() {
	defer func() {
		if r := recover(); r != nil {
			log.Printf("broadcaster panic: %v", r)
		}
	}()

	heartbeat := time.NewTicker(30 * time.Second)
mainLoop:
	for {
		select {
		case <-b.doneChan:
			break mainLoop

		case t := <-heartbeat.C:
			log.Printf("broadcaster: %d listeners, %d goroutines", len(b.listeners), runtime.NumGoroutine())

			e := &HeartbeatEvent{
				Time: t,
			}

			ts := t.Unix()
			for _, l := range b.listeners {
				if l.Token == nil {
					continue
				}
				if l.Token.Payload.Expires < ts {
					if f, ok := l.callbacks[EventTypeTokenExpired]; ok {
						f(&TokenExpiredEvent{})
					}
					continue
				}
				if !e.CanReceive(l.Token.User) {
					continue
				}
				if f, ok := l.callbacks[EventTypeHeartbeat]; ok {
					f(e)
				}
			}

		case e := <-b.eventChan:
			ts := time.Now().Unix()
			for _, l := range b.listeners {
				if l.Token == nil {
					continue
				}
				if l.Token.Payload.Expires < ts {
					continue
				}
				if !e.CanReceive(l.Token.User) {
					continue
				}
				if f, ok := l.callbacks[e.Type()]; ok {
					f(e)
				}
			}

		case listener := <-b.registerListenerChan:
			log.Printf("register listener %d", b.serial)
			listener.id = b.serial
			b.serial++
			b.listeners[listener.id] = listener

		case listener := <-b.removeListenerChan:
			log.Printf("remove listener %d", listener.id)
			delete(b.listeners, listener.id)
			listener.id = 0

		default:
			time.Sleep(10 * time.Millisecond)
		}
	}

	heartbeat.Stop()
	close(b.doneChan)
	close(b.registerListenerChan)
	close(b.removeListenerChan)
	close(b.eventChan)
}
