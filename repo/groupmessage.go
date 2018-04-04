package repo

import (
	"database/sql"

	"github.com/b75/fraternal-wookie/model"
)

type groupMessageRepo struct {
	db *sql.DB
}

func (r *groupMessageRepo) FindByGroup(group *model.Group, after int64) model.GroupMessageViews {
	msgs := model.GroupMessageViews{}

	if group == nil {
		return msgs
	}

	rows, err := r.db.Query("SELECT id, ctime, group_id, user_id, message, username FROM work_group_message_view WHERE group_id = $1 AND id > $2 ORDER BY ctime", group.Id, after)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		msg := &model.GroupMessageView{}
		if err := rows.Scan(
			&msg.Id,
			&msg.Ctime,
			&msg.GroupId,
			&msg.UserId,
			&msg.Message,
			&msg.Username,
		); err != nil {
			panic(err)
		}
		msgs = append(msgs, msg)
	}

	if err = rows.Err(); err != nil {
		panic(err)
	}

	return msgs
}

func (r *groupMessageRepo) Insert(gm *model.GroupMessage) error {
	var id int64

	if err := r.db.QueryRow("INSERT INTO work_group_message (group_id, user_id, message) VALUES ($1, $2, $3) RETURNING id", gm.GroupId, gm.UserId, gm.Message).Scan(&id); err != nil {
		return err
	}
	gm.Id = id

	return nil
}
