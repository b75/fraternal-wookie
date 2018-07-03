package api

import (
	"net/http"

	"github.com/b75/fraternal-wookie/apirouter"
	"github.com/b75/fraternal-wookie/model"
	"github.com/b75/fraternal-wookie/repo"
)

func init() {
	apirouter.RegisterHandler("/files", requestFiles)
}

type Files struct {
	Params     *model.FileSearchParams
	Files      model.Files
	TotalCount int64
}

func requestFiles(rq *http.Request) (apirouter.Handler, error) {
	params := &model.FileSearchParams{}
	if err := params.FromQuery(rq.URL.Query()); err != nil {
		return nil, apirouter.ErrBadRequest(err)
	}

	files, total := repo.Files.Search(params)

	return &Files{
		Params:     params,
		Files:      files,
		TotalCount: total,
	}, nil
}

func (page *Files) CanAccess(current *model.User) bool {
	return page.Params != nil && current.HasId(page.Params.UserId)
}

func (page *Files) HandleGet(w http.ResponseWriter) error {
	return apirouter.JsonResponse(w, &model.FileSearchResult{
		Params:     page.Params,
		TotalCount: page.TotalCount,
		Result:     page.Files,
	})
}
