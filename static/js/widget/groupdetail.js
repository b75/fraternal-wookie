"use strict";

(function() {

	var groupDetailWidgetController = function(widget) {
		var group = widget.data("group-id");

		Conn.connect();

		return {
			update: _.throttle(function() {
				Api.get.group(group).done(function(result) {
					widget.find(".js-field[data-field=group-name]").html(result.Name);	
					widget.find(".js-field[data-field=group-description]").html(result.Description);	
				}).fail(function(error) {
					Util.handleFail(error);
				});
			}, 1000),

			subscribe: function() {
				Conn.send("subscribe group-detail-edit " + group);
			}	
		};
	}

	// onload
	$(function() {
		$(".js-widget.group-detail-widget").each(function(i, v) {
			var widget = $(v);
			widget.data("controller", groupDetailWidgetController(widget));
			$("body").on("ws-conn-open", function(event) {
				widget.data("controller").subscribe();
			});
		});

		$(".js-widget.group-detail-widget").on("js-widget-refresh", function(event) {
			event.preventDefault();
			$(this).data("controller").update();
		});

		$(".js-widget.group-detail-widget").on("ws-group-detail-edit", function(event) {
			event.preventDefault();
			$(this).data("controller").update();
		});
	});
}());
