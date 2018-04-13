package event

import (
	"log"
	"time"

	"github.com/b75/fraternal-wookie/model"
	"sync"
)

const (
	EventBufSize = 128
)

// TODO Listeners are kinda racy atm
type Listener struct {
	id        uint64
	callbacks map[uint64]func(e Event)
	User      *model.User
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

	heartbeat := time.NewTicker(10 * time.Second)
mainLoop:
	for {
		select {
		case <-b.doneChan:
			break mainLoop

		case t := <-heartbeat.C:
			log.Printf("broadcaster: %d listeners", len(b.listeners))

			e := &HeartbeatEvent{
				Time: t,
			}

			for _, l := range b.listeners {
				if !e.CanReceive(l.User) {
					continue
				}
				if f, ok := l.callbacks[EventTypeHeartbeat]; ok {
					f(e)
				}
			}

		case e := <-b.eventChan:
			for _, l := range b.listeners {
				if !e.CanReceive(l.User) {
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
