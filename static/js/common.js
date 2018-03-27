"use strict";

// onload
$(function() {

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
			alert(xhr.responseText ? xhr.responseText : "Operation failed");
		});
	});

	$(".tabular.menu .item").tab();

});
