"use strict";

// onload
$(function() {

	$.when(Token.load()).then(function() {
		console.log("token loaded");
	});
	if (!Api.setUrl($("body").data("api-url"))) {
		console.error("error setting api url");
	}

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
