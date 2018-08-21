"use strict";

var Token = (function() {

	let current = null;

	const storageKey = "fraternal-wookie-token";

	let isValid = function(obj) {
		if (typeof obj !== "object") {
			return false;
		}
		if (!obj.token || typeof obj.token !== "string") {
			return false;
		}
		if (typeof obj.expiry !== "number" || !(obj.expiry > 0)) {
			return false;
		}

		return Math.floor(Date.now() / 1000) < obj.expiry;
	}

	return {
		get: function() {
			if (current) {
				if (isValid(current)) {
					return current.token;
				}
				current = null;
			}

			let fromStorage = sessionStorage.getItem(storageKey);
			if (fromStorage) {
				current = JSON.parse(fromStorage);
				if (isValid(current)) {
					return current.token;
				}
				sessionStorage.removeItem(storageKey);
				current = null;
			}

			return null;
		},

		set: function(token, expiry) {
			if (!token || typeof token !== "string") {
				throw "Token.set: invalid token";
			}
			if (typeof expiry !== "number" || !(expiry > 0)) {
				throw "Token.set: invalid expiry";
			}

			current = {
				token: token,
				expiry: expiry
			};
			sessionStorage.setItem(storageKey, JSON.stringify(current));
		},

		clear: function() {
			sessionStorage.removeItem(storageKey);
			current = null;
		}
	};
}());
