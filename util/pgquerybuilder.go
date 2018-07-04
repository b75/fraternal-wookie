package util

import (
	"errors"
	"strconv"
	"strings"
)

type PgQueryBuilder struct {
	fields  string
	from    string
	wheres  []string
	groupby string
	havings []string
	orderby string
	limit   uint64
	offset  uint64
	args    []interface{}
}

func (b *PgQueryBuilder) Sql() string {
	sql := "SELECT " + b.fields + "\n"
	sql += "FROM " + b.from + "\n"

	if len(b.wheres) != 0 {
		sql += "WHERE\n"
		for i, where := range b.wheres {
			if i != 0 {
				sql += " AND "
			}
			sql += "(" + where + ")"
		}
		sql += "\n"
	}
	if b.groupby != "" {
		sql += "GROUP BY " + b.groupby + "\n"
	}
	if len(b.havings) != 0 {
		sql += "HAVING\n"
		for i, having := range b.havings {
			if i != 0 {
				sql += " AND "
			}
			sql += "(" + having + ")"
		}
		sql += "\n"
	}
	if b.orderby != "" {
		sql += "ORDER BY " + b.orderby + "\n"
	}
	if b.limit != 0 {
		sql += "LIMIT " + strconv.FormatUint(b.limit, 10) + "\n"
	}
	if b.offset != 0 {
		sql += "OFFSET " + strconv.FormatUint(b.offset, 10) + "\n"
	}

	index := strings.IndexRune(sql, '?')
	nr := 0
	for index >= 0 {
		sql = sql[0:index] + "$" + strconv.Itoa(nr+1) + sql[index+1:]
		index = strings.IndexRune(sql, '?')
		nr++
	}

	if nr != len(b.args) {
		panic(errors.New("argument count mismatch"))
	}

	return sql
}

func (b *PgQueryBuilder) Args() []interface{} {
	return b.args
}

func (b *PgQueryBuilder) Select(fields string) *PgQueryBuilder {
	b.fields = fields
	return b
}

func (b *PgQueryBuilder) From(from string) *PgQueryBuilder {
	b.from = from
	return b
}

func (b *PgQueryBuilder) Where(where string, args ...interface{}) *PgQueryBuilder {
	b.wheres = append(b.wheres, where)
	b.args = append(b.args, args...)
	return b
}

func (b *PgQueryBuilder) GroupBy(groupby string) *PgQueryBuilder {
	b.groupby = groupby
	return b
}

func (b *PgQueryBuilder) Having(having string, args ...interface{}) *PgQueryBuilder {
	b.havings = append(b.havings, having)
	b.args = append(b.args, args...)
	return b
}

func (b *PgQueryBuilder) OrderBy(orderby string) *PgQueryBuilder {
	b.orderby = orderby
	return b
}

func (b *PgQueryBuilder) Limit(limit uint64) *PgQueryBuilder {
	b.limit = limit
	return b
}

func (b *PgQueryBuilder) Offset(offset uint64) *PgQueryBuilder {
	b.offset = offset
	return b
}
