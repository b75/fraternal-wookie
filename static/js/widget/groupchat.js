"use strict";

(function() {

	var groupChatWidgetController = function(widget) {
		var group = widget.data("group-id");
		var lastMsg= parseInt(widget.children().last().data("msg-id"));
		var latest = lastMsg ? lastMsg : 0; 
		var tpl = _.template(Tpl.groupMessage());

		Conn.connect();

		return {
			update: _.throttle(function() {
				Api.get.groupMessages(group, latest).done(function(result) {
					$.each(result, function(i, msg) {
						if (msg.Id > latest) {
							latest = msg.Id;
						}
						widget.append(tpl(msg));
					});
				}).fail(function(error) {
					Util.handleFail(error);
				});
			}, 250),

			subscribe: function() {
				Conn.send("subscribe new-group-message " + group);
			}
		};
	};
	
	// onload
	$(function() {
		$(".js-widget.group-chat-widget").each(function(i, v) {
			var widget = $(v);
			widget.data("controller", groupChatWidgetController(widget));
			$("body").on("ws-conn-open", function(event) {
				widget.data("controller").subscribe();
			});
		});

		$(".js-widget.group-chat-widget").on("js-widget-refresh", function(event) {
			event.preventDefault();
			$(this).data("controller").update();
		});

		$(".js-widget.group-chat-widget").on("ws-new-group-message", function(event) {
			event.preventDefault();
			$(this).data("controller").update();
		});
	});
}());
