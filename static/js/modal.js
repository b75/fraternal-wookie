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
});
