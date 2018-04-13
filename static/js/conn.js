"use strict";

var Conn = (function() {
	var connUrl = null;
	var conn = null;
	return {

		connect: function() {
			if (conn) {
				return;
			}

			if (!window["WebSocket"]) {
				console.error("websockets not supported");
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
			}
			conn.onerror = function(error) {
				console.error("socket connection error:", error);
				conn = null;
			}
		},

		close: function() {
			if (!conn) {
				return;
			}
			conn.close();
			conn = null;
		},

		send: function(data) {
			if (!conn) {
				console.error("no connection");
				return false;
			}
			if (typeof data !== "string") {
				console.error("socket connection send: data must be of type string");
				return false;
			}
			if (!data) {
				console.error("socket connection send: empty data");
				return false;
			}
			conn.send(data);
			return true;
		},

		setUrl: function(url) {
			if (connUrl) {
				return false;
			}
			if (typeof url !== "string" || !url) {
				return false;
			}
			connUrl = url;
			return true;
		}
	};
}());
