"use strict";

var Conn = (function() {
	var connUrl = null;
	var conn = null;

	return {
		connect:	function() {
			if (conn) {
				return;
			}

			if (!window["WebSocket"]) {
				console.error("websockets not supported");
				return;
			}
			if (!connUrl) {
				console.error("connection url not set");
				return;
			}

			conn = new WebSocket(connUrl);
			conn.onopen = function() {
				console.log("socket connection open");
				Token.get().done(function(token) {
					Conn.send("auth Bearer " + token);
					$("body").trigger("ws-conn-open");
				});
			};
			conn.onclose = function(event) {
				console.log("socket connection close:", event);
				conn = null;
			};
			conn.onmessage = function(event) {
				if (!event.isTrusted) {
					console.error("socket connection untrusted message:", event);
					return;
				}

				var parts = String(event.data).split(" ");
				switch (parts[0]) {
					case "new-group-message":
						$(".js-widget.group-chat-widget").trigger({
							type: "ws-new-group-message",
							group: parts[1]
						});
						break;
					case "expired":
						Token.clear();
						Token.get().done(function(token) {
							Conn.send("auth Bearer " + token);
						});
						break;
					default:
						console.log("socket connection message:", event.data);
				}
			};
			conn.onerror = function(error) {
				console.error("socket connection error:", error);
				conn = null;
			};

		},

		send: function(data) {
			if (!conn) {
				return "no connection";
			}
			if (typeof data !== "string" || !data) {
				return "data must be non-empty string";
			}
			conn.send(data);
			return true;
		},

		close: function() {
			if (!conn) {
				return;
			}
			conn.close();
			conn = null;
		},

		setUrl: function(url) {
			if (typeof url !== "string" || !url) {
				return false;
			}
			connUrl = url;
			return true;
		}
	};
})();
