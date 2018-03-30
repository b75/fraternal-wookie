"use strict";

// onload
$(function() {

	Token.load();

	$(".js-post-link").on("click", function(event) {
		event.preventDefault();

		var link = $(this);
		var href = link.attr("href");
		if (!href) {
			return;
		}

		$.ajax({
			method: "POST",
			url: href
		}).done(function(response) {
			switch (link.data("next")) {
				case "reload":
					location.reload(true);
					break;
			}
		}).fail(function(xhr) {
			Util.handleFail(xhr.responseText ? xhr.responseText : xhr);
		});
	});

	$(".tabular.menu .item").tab();

});
