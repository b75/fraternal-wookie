"use strict";

var Token = (function() {
	var current = null;
	var loading = false;

	return {
		get: function() {
			if (!current) {
				this.load();
			}
			return current;
		},

		load: function() {
			if (current || loading) {
				return;
			}

			var fromStorage = sessionStorage.getItem("fraternal-wookie-token");
			if (fromStorage) {
				current = fromStorage;
				return;
			}

			// TODO expiry

			loading = true;
			$.ajax({
				method: "GET",
				url: "/token",
				timeout: 5000,
			}).done(function(response) {
				if (typeof response !== "object" || response.Success !== true) {
					Util.handleFail(response);
					return;
				}
				current = response.Token;
				sessionStorage.setItem("fraternal-wookie-token", response.Token);
			}).fail(function(xhr) {
				Util.handleFail(xhr.responseText ? xhr.ResponseText : xhr);
			}).always(function() {
				loading = false;
			});
		},

		clear: function() {
			sessionStorage.removeItem("fraternal-wookie-token");
			current = null;
		}
	};
}());
