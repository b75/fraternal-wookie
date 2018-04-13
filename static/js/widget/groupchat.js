"use strict";

(function() {

	var GroupChatWidgetController = function(widget) {
		var group = widget.data("group-id");
		var lastMsg= parseInt(widget.children().last().data("msg-id"));
		var latest = lastMsg ? lastMsg : 0; 

		return {
			update: _.throttle(function() {
				Api.get.groupMessages(group, latest).done(function(result) {
					$.each(result, function(i, msg) {
						if (msg.Id > latest) {
							latest = msg.Id;
						}

						var html = '<div class="comment" data-msg-id="' + msg.Id + '">';
						html +=    ' <div class="content">';
						html +=    '  <a class="author">' + msg.Username  + '</a>';
						html +=    '   <div class="metadata">';
						html +=    '    <span class="date">' + msg.Ctime + '</span>';
						html +=    '   </div>';
						html +=    '   <div class="text">' + msg.Message + '</div>';
						html +=    ' </div>';
						html +=    '</div>';
						widget.append(html);
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
			widget.data("controller", GroupChatWidgetController(widget));
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
