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

	var groupUploadFileModal = $("#group-upload-file-modal");
	if (groupUploadFileModal.length) {
		let form = $("#group-upload-file-form");
		let input = form.find("input[name=File]");
		input.files = [];

		form.find(".js-select-file").on("click", function(event) {
			event.preventDefault();
			input.click();
		});

		groupUploadFileModal.modal({
			onShow: function(elem) {
				form[0].reset();
			},
			onApprove: function(elem) {
				Upload.multiple(input[0].files);
			}
		});
	}
});
