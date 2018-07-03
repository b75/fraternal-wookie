"use strict";

var Api = (function() {
	var apiUrl = null;

	return {

		call: function(method, url, data) {
			var dfd = $.Deferred();

			$.when(Token.get()).then(function(token) {
				switch (method) {
					case "GET":
						$.ajax({
							method: "GET",
							url: apiUrl + url,
							timeout: 3000,
							data: typeof data === "object" ? data : {},
							headers: {
								Authorization: "Bearer " + token
							}
						}).done(function(response) {
							if (Api.isSuccess(response)) {
								dfd.resolve(response.Result);
							} else {
								dfd.reject(response.Error);
							}
						}).fail(function(xhr) {
							dfd.reject((xhr.responseJSON ? xhr.responseJSON.Error : xhr.responseText) || "unknown error");
						});
						break;
					case "POST":
						$.ajax({
							method: "POST",
							url: apiUrl + url,
							timeout: 3000,
							data: JSON.stringify(typeof data === "object" ? data : {}),
							contentType: "application/json; charset=utf-8",
							dataType: "json",
							headers: {
								Authorization: "Bearer " + token
							}
						}).done(function(response) {
							if (Api.isSuccess(response)) {
								dfd.resolve(response.Result);
							} else {
								dfd.reject(response.Error);
							}
						}).fail(function(xhr, foo, bar, car) {
							dfd.reject((xhr.responseJSON ? xhr.responseJSON.Error : xhr.responseText) || "unknown error");
						});
						break;
					default:
						dfd.reject("unsupported method: " + String(method));
				}
			}, function(error) {
				dfd.reject(error);
			});

			return dfd.promise();
		},

		get: {
			tokenInfo: function() {
				return Api.call("GET", "/tokeninfo");
			},

			groupMessages: function(groupId, after) {
				return Api.call("GET", "/groupmessages", {
					Id: String(groupId),
					After: after ? String(after) : "0"
				});
			},

			groupFeeds: function(groupId, after, limit) {
				return Api.call("GET", "/groupfeeds", {
					Id: String(groupId),
					After: after ? String(after) : "0",
					Limit: limit ? String(limit) : "0",
				});
			},

			group: function(groupId) {
				return Api.call("GET", "/group", {
					Id: String(groupId)
				});
			},

			files: function(params) {
				return Api.call("GET", "/files", params);
			}
		},

		post: {
			groupMessageNew: function(groupId, data) {
				return Api.call("POST", "/groupmessage/new?GroupId=" + String(groupId), data);
			},

			groupEdit: function(groupId, data) {
				return Api.call("POST", "/group/edit?Id=" + String(groupId), data);
			},

			groupFeedNew: function(groupId, data) {
				return Api.call("POST", "/groupfeed/new?GroupId=" + String(groupId), data);
			},

			uploadNew: function(data) {
				return Api.call("POST", "/uploadnew", data);
			},

			downloadNew: function(file) {
				return Api.call("POST", "/downloadnew?Hash=" + String(file));
			}
		},

		setUrl: function(url) {
			if (apiUrl) {
				return false;
			}
			if (typeof url !== "string" || !url) {
				return false;
			}
			apiUrl = url;
			return true;
		},

		getUrl: function() {
			return apiUrl;
		},

		isSuccess: function(response) {
			return typeof response === "object" && response.Success === true;
		}
	}
}());
