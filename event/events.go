package event

import (
	"time"

	"github.com/b75/fraternal-wookie/model"
)

const (
	EventTypeHeartbeat uint64 = 1 + iota
)

type HeartbeatEvent struct {
	Time time.Time
}

func (e *HeartbeatEvent) Type() uint64 {
	return EventTypeHeartbeat
}

func (e *HeartbeatEvent) CanReceive(user *model.User) bool {
	return user != nil
}
