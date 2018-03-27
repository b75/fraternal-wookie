package repo

import (
	"database/sql"

	"github.com/b75/fraternal-wookie/model"
)

type groupMessageRepo struct {
	db *sql.DB
}

func (r *groupMessageRepo) FindByGroup(group *model.Group) model.GroupMessages {
	msgs := model.GroupMessages{}

	if group == nil {
		return msgs
	}

	rows, err := r.db.Query("SELECT id, ctime, group_id, username, message FROM work_group_message WHERE group_id = $1 ORDER BY ctime", group.Id)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		msg := &model.GroupMessage{}
		if err := rows.Scan(
			&msg.Id,
			&msg.Ctime,
			&msg.GroupId,
			&msg.Username,
			&msg.Message,
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

	if err := r.db.QueryRow("INSERT INTO work_group_message (group_id, username, message) VALUES ($1, $2, $3) RETURNING id", gm.GroupId, gm.Username, gm.Message).Scan(&id); err != nil {
		return err
	}
	gm.Id = id

	return nil
}
