"use strict";

(function() {
	let fileListWidgetController = function(widget) {
		let user = widget.data("user-id");
		let tbody = widget.find("tbody");
		let params = {
			UserId: user,
			Limit: 20,
			Offset: 0
		};

		Conn.connect();

		return {
			update: _.throttle(function() {
				console.log("TODO filelist update");
				Api.get.files(params).done(function(result) {
					tbody.empty();
					$.each(result.Result, function(i, file) {
						let item = $(Tpl.file(file));
						Util.initHtmlElem(item);
						tbody.append(item);
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
			},

			setParam: function(key, value) {
				if (!key || typeof key !== "string") {
					return;
				}
				params[key] = value;
			}
		};
	};

	let fileListControlsWidgetController = function(widget) {
		let list = $(widget.data("list"));
		if (list.length !== 1) {
			console.error("file list controls widget must be connected to exactly one file list widget");
			return;
		}

		return {
			onChange: function(input) {
				let listCtrl = list.data("controller");
				listCtrl.setParam(input.attr("name"), input.val());
			},

			onSearch: function() {
				let listCtrl = list.data("controller");
				listCtrl.update();
			}
		};
	};

	// onload
	$(function() {
		// file list widget
		$(".js-widget.file-list-widget").each(function(i, v) {
			let widget = $(v);
			let ctrl = fileListWidgetController(widget);
			widget.data("controller", ctrl);

			$("body").on("ws-event", function(event) {
				ctrl.onWsEvent(event);
			});
		});

		// file list controls widget
		$(".js-widget.file-list-controls-widget").each(function(i, v) {
			let widget = $(v);
			let ctrl = fileListControlsWidgetController(widget);

			widget.find("input").val("").on("change", function(event) {
				ctrl.onChange($(this));
			});

			widget.find(".search-button").on("click", function(event) {
				event.preventDefault();
				ctrl.onSearch();
			});
		});
	});
}());
