"use strict";

// onload
$(function() {
	$("#group-detail-modal").modal({
		onApprove: function(elem) {
			var form = $("#group-detail-form");
			if (!form.form("is valid")) {
				return false;
			}

			var data = {};
			$.each(form.serializeArray(), function(i, field) {
				data[field.name] = field.value;
			});

			Api.post.groupEdit(form.data("group-id"), data).done(function(result) {
				$(".js-widget.group-detail-widget").trigger({
					type: "js-widget-refresh"
				});
			}).fail(function(error) {
				Util.handleFail(error);
			});
		}
	});

	$("#new-feed-modal").modal({
		onApprove: function(elem) {
			var form = $("#new-feed-form");
			if (!form.form("is valid")) {
				return false;
			}

			var data = {};
			$.each(form.serializeArray(), function(i, field) {
				data[field.name] = field.value;
			});

			Api.post.groupFeedNew(form.data("group-id"), data).done(function(result) {
				$(".js-widget.group-feed-widget").trigger({
					type: "js-widget-refresh"
				});
			}).fail(function(error) {
				Util.handleFail(error);
			});
		}
	});

	var uploadModal = $("#upload-modal");
	if (uploadModal.length) {
		let form = $("#upload-form");
		let input = form.find("input[name=File]");
		let list = form.find(".js-file-selection-list");
		let tpl = _.template(Tpl.fileSelection());
		input.files = [];

		input.on("change", function(event) {
			list.empty();
			form.form("validate form");
			let total = 0;
			for (let i = 0; i < input[0].files.length; i++) {
				let file = input[0].files[i];
				total += file.size;
				let item = tpl({
					filename: file.name,
					size: Util.formatFileSize(file.size)
				});
				list.append(item);
			}
			let item = _.template(Tpl.fileSelectionTotal())({
				size: Util.formatFileSize(total)
			});
			list.append(item);
		});

		form.find(".js-select-file").on("click", function(event) {
			event.preventDefault();
			input.click();
		});

		uploadModal.modal({
			onShow: function(elem) {
				form[0].reset();
				form.form("validate form");
				list.empty();
			},
			onApprove: function(elem) {
				if (!input[0].files.length) {
					form.form("add errors", ["Please select at least one file"]);
					return false;
				}
				Upload.multiple(input[0].files);
			}
		});
	}
});
