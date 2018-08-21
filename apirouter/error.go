package apirouter

/*
 * 404 Not Found
 */
type notFoundError struct{}

func (err *notFoundError) Error() string {
	return "not found"
}

func ErrNotFound() *notFoundError {
	return &notFoundError{}
}

/*
 * 400 Bad Request
 */
type badRequestError struct {
	err error
}

func (err *badRequestError) Error() string {
	return "bad request"
}

func ErrBadRequest(err error) *badRequestError {
	return &badRequestError{
		err: err,
	}
}

/*
 * 403 Forbidden
 */
type forbiddenError struct{}

func (err *forbiddenError) Error() string {
	return "forbidden"
}

func ErrForbidden() *forbiddenError {
	return &forbiddenError{}
}
