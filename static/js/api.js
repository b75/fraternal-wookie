"use strict";

var Api = (function() {
	var apiUrl = null;

	return {

		call: function(method, url) {
			var dfd = $.Deferred();

			$.when(Token.get()).then(function(token) {
				$.ajax({
					method: method,
					url: apiUrl + url,
					timeout: 3000,
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
					dfd.reject(xhr.responseText);
				});
			}, function(error) {
				dfd.reject(error);
			});

			return dfd.promise();
		},

		get: {
			tokenInfo: function() {
				return Api.call("GET", "/tokeninfo");
			}
		},

		post: {},

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

		isSuccess: function(response) {
			return typeof response === "object" && response.Success === true;
		}
	}
}());
