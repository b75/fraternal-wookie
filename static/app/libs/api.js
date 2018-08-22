"use strict";

var Api = (function() {
	let apiUrl = null;

	const timeout = 3000;

	return {
		call: function(method, url, data) {
			let dfd = $.Deferred();

			let headers = {};
			let token = Token.get();
			if (token) {
				headers.Authorization = "Bearer " + token;
			}

			switch (method) {
				case "GET":
					$.ajax({
						method: "GET",
						url: Api.getUrl() + url,
						timeout: timeout,
						data: typeof data === "object" ? data : {},
						dataType: "json",
						headers: headers
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
						url: Api.getUrl() + url,
						timeout: timeout,
						data: JSON.stringify(typeof data === "object" ? data : {}),
						contentType: "application/json; charset=utf-8",
						dataType: "json",
						headers: headers
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
				default:
					dfd.reject("unsupported method: " + String(method));
					return dfd.promise();
			}

			return dfd.promise();
		},

		setUrl: function(url) {
			if (apiUrl) {
				throw "Api.setUrl: url set twice";
			}
			if (!url || typeof url !== "string") {
				throw "Api.setUrl: invalid url";
			}
			apiUrl = url;
		},

		getUrl: function() {
			if (!apiUrl) {
				throw "Api.setUrl: url not set";
			}
			return apiUrl;
		},

		isSuccess(response) {
			return typeof response === "object" && response.Success === true;
		}
	};
}());
