"use strict";

(function() {
	const HeartbeatIntervalMax = 35000;

	let connWidgetController = function(widget) {
		let statusElem = widget.find(".conn-status");
		let heartbeatElem = widget.find(".conn-heartbeat");
		let heartbeatFail = function() {
			heartbeatElem.removeClass("green");
		};
		let heartbeatTimeout = setTimeout(heartbeatFail, HeartbeatIntervalMax);
		
		Conn.connect();

		return {
			onWsEvent: function(event) {
				switch (event.type) {
					case "ws-conn-open":
						statusElem.removeClass("red").addClass("green");
						statusElem.removeClass("down").addClass("up");
						break;
					case "ws-conn-close":
					case "ws-conn-error":
						statusElem.removeClass("green").addClass("red");
						statusElem.removeClass("up").addClass("down");
						break;
					case "ws-conn-heartbeat":
						clearTimeout(heartbeatTimeout);
						heartbeatElem.addClass("green");
						heartbeatTimeout = setTimeout(heartbeatFail, HeartbeatIntervalMax);
						break;
				}
			}
		};
	}

	// onload
	$(function() {
		$(".js-widget.conn-widget").each(function(i, v) {
			let widget = $(v);
			let ctrl = connWidgetController(widget);
			widget.data("controller", ctrl);

			$("body").on("ws-conn-open ws-conn-close ws-conn-error ws-conn-heartbeat", function(event) {
				ctrl.onWsEvent(event);
			});
		});
	});
}());
