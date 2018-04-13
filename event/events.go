package event

import (
	"time"

	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

const (
	EventTypeHeartbeat uint64 = 1 + iota
	EventTypeNewGroupMessage
)

type Event interface {
	Type() uint64
	CanReceive(*model.User) bool
}

/* Heartbeat */
type HeartbeatEvent struct {
	Time time.Time
}

func (e *HeartbeatEvent) Type() uint64 {
	return EventTypeHeartbeat
}

func (e *HeartbeatEvent) CanReceive(user *model.User) bool {
	return user != nil
}

/* NewGroupMessage */
type NewGroupMessageEvent struct {
	Group *model.Group
	Admin *model.User
}

func (e *NewGroupMessageEvent) Type() uint64 {
	return EventTypeNewGroupMessage
}

func (e *NewGroupMessageEvent) CanReceive(user *model.User) bool {
	return user.Is(e.Admin) || repo.Groups.IsMember(e.Group, user)
}