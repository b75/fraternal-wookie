"use strict";

var Token = (function() {
	var current = null;
	var expired = function(tokenObject) {
		return Math.floor(Date.now() / 1000) > (tokenObject.Expiry ? tokenObject.Expiry : 0);
	}

	return {
		get: function() {
			var dfd = $.Deferred();

			$.when(this.load()).then(function(result) {
				dfd.resolve(result.Token);
			}, function(error) {
				dfd.reject(error);
			});

			return dfd.promise();
		},

		load: function() {
			if (current) {
				if (!expired(current)) {
					return current;
				}
				current = null;
			}

			var fromStorage = sessionStorage.getItem("fraternal-wookie-token");
			if (fromStorage) {
				current = JSON.parse(fromStorage);
				if (!expired(current)) {
					return current;
				}
				sessionStorage.removeItem("fraternal-wookie-token");
				current = null;
			}

			var dfd = $.Deferred();

			$.ajax({
				method: "GET",
				url: "/token",
				timeout: 5000,
			}).done(function(response) {
				if (typeof response !== "object") {
					dfd.reject(String(response));
					return;
				}
				if (response.Success !== true) {
					dfd.reject(response.Error);
					return;
				}
				current = response.Result;
				sessionStorage.setItem("fraternal-wookie-token", JSON.stringify(response.Result));
				dfd.resolve(response.Result);
			}).fail(function(xhr) {
				dfd.reject(xhr.responseText);
			});

			return dfd.promise();
		},

		expiry: function() {
			if (!current) {
				console.log("no current token");
				return;
			}
			console.log("current token expires in", (current.Expiry ? current.Expiry : 0) - Math.floor(Date.now() / 1000), "seconds");
		},

		clear: function() {
			sessionStorage.removeItem("fraternal-wookie-token");
			current = null;
		}
	};
}());
