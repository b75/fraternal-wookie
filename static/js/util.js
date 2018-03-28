"use strict";

var Util = (function() {
	return {
		postJsonForm(form) {
			form = $(form);
			if (!form.length) {
				return;
			}

			var data = JSON.stringify(form.serializeArray());
			var action = form.attr("action");
			if (!action) {
				return;
			}

			$.ajax({
				method: "POST",
				url: action,
				data: data,
				contentType: "application/json; charset=utf-8",
			}).done(function(response) {
				switch (form.data("next")) {
					case "reload":
						location.reload(true);
						break;
				}
			}).fail(function(xhr) {
				var errorMsg = xhr.responseText ? xhr.responseText : "Operation failed"
				form.form("add errors", [errorMsg]);
			});
		}
	};
}());
