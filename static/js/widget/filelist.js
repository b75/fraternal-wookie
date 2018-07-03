"use strict";

(function() {
	let fileListWidgetController = function(widget) {
		let user = widget.data("user-id");
		let tpl = _.template(Tpl.file());
		let tbody = widget.find("tbody");

		Conn.connect();

		return {
			update: _.throttle(function() {
				Api.get.files({
					UserId: user,
					Limit: 20,
					Offset: 0
				}).done(function(result) {
					tbody.empty();
					$.each(result.Result, function(i, file) {
						tbody.append(tpl(file));
					});
				}).fail(function(error) {
					Util.handleFail(error);
				});
			}, 250),

			onWsEvent: function(event) {
				if (event.kind !== "new-file-access") {
					return;
				}
				let uid = event.args && event.args.length ? parseInt(event.args[0]) : null;
				if (uid !== user) {
					return;
				}
				this.update();
			}
		};
	};


	// onload
	$(function() {
		$(".js-widget.file-list-widget").each(function(i, v) {
			let widget = $(v);
			let ctrl = fileListWidgetController(widget);
			widget.data("controller", ctrl);
			$("body").on("ws-event", function(event) {
				ctrl.onWsEvent(event);
			});
		});
	});
}());
