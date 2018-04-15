package repo

import (
	"database/sql"

	"github.com/b75/fraternal-wookie/model"
)

type groupFeedRepo struct {
	db *sql.DB
}

func (r *groupFeedRepo) FindByGroup(group *model.Group, after int64) model.GroupFeeds {
	feeds := model.GroupFeeds{}

	if group == nil {
		return feeds
	}

	rows, err := r.db.Query("SELECT id, ctime, group_id, user_id, header, body FROM work_group_feed WHERE group_id = $1 AND id > $2 ORDER BY ctime DESC", group.Id, after)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		feed := &model.GroupFeed{}
		if err := rows.Scan(
			&feed.Id,
			&feed.Ctime,
			&feed.GroupId,
			&feed.UserId,
			&feed.Header,
			&feed.Body,
		); err != nil {
			panic(err)
		}
		feeds = append(feeds, feed)
	}

	if err = rows.Err(); err != nil {
		panic(err)
	}

	return feeds
}

func (r *groupFeedRepo) Insert(feed *model.GroupFeed) error {
	var id int64

	if err := r.db.QueryRow("INSERT INTO work_group_feed (group_id, user_id, header, body) VALUES ($1, $2, $3, $4) RETURNING id", feed.GroupId, feed.UserId, feed.Header, feed.Body).Scan(&id); err != nil {
		return err
	}
	feed.Id = id

	return nil
}
