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
					var msgs = widget.children();
					msgs.each(function(i, msg) {
						if (msgs.length - i > 10) {
							msg.remove();
						}
					});
				}).fail(function(error) {
					Util.handleFail(error);
				});
			}, 250),

			onWsEvent: function(event) {
				if (event.kind !== "new-group-message") {
					return;
				}
				var gid = event.args && event.args.length ? parseInt(event.args[0]) : null;
				if (gid !== group) {
					return;
				}
				this.update();
			}
		};
	};
	
	// onload
	$(function() {
		$(".js-widget.group-chat-widget").each(function(i, v) {
			var widget = $(v);
			var ctrl = groupChatWidgetController(widget);
			widget.data("controller", ctrl);
			$("body").on("ws-event", function(event) {
				ctrl.onWsEvent(event);
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
