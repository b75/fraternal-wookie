package repo

import (
	"database/sql"

	"github.com/b75/fraternal-wookie/model"
)

type groupRepo struct {
	db *sql.DB
}

func (r *groupRepo) Find(id int64) *model.Group {
	group := &model.Group{}

	if err := r.db.QueryRow("SELECT id, ctime, name, description, admin FROM work_group WHERE id = $1", id).Scan(
		&group.Id,
		&group.Ctime,
		&group.Name,
		&group.Description,
		&group.Admin,
	); err != nil {
		if err != sql.ErrNoRows {
			panic(err)
		}
		return nil
	}

	return group
}

func (r *groupRepo) FindByMember(member *model.User) model.Groups {
	groups := model.Groups{}

	if member == nil {
		return groups
	}

	rows, err := r.db.Query("SELECT g.id, g.ctime, g.name, g.description, g.admin FROM work_group g JOIN work_group_member m ON (g.id = m.group_id) WHERE m.username = $1", member.Username)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		group := &model.Group{}
		if err := rows.Scan(
			&group.Id,
			&group.Ctime,
			&group.Name,
			&group.Description,
			&group.Admin,
		); err != nil {
			panic(err)
		}
		groups = append(groups, group)
	}

	if err = rows.Err(); err != nil {
		panic(err)
	}

	return groups
}

func (r *groupRepo) Members(group *model.Group) model.Users {
	members := model.Users{}

	if group == nil {
		return members
	}

	rows, err := r.db.Query("SELECT w.username, w.email FROM work_group_member m JOIN wookie w ON (m.username = w.username) WHERE m.group_id = $1", group.Id)
	if err != nil {
		panic(err)
	}
	defer rows.Close()

	for rows.Next() {
		member := &model.User{}
		if err := rows.Scan(&member.Username, &member.Email); err != nil {
			panic(err)
		}
		members = append(members, member)
	}

	if err = rows.Err(); err != nil {
		panic(err)
	}

	return members
}
