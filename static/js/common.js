"use strict";

// onload
$(function() {

	$.when(Token.load()).then(null, function(error) {
		console.error("token load error:", error);
	});
	if (!Api.setUrl($("body").data("api-url"))) {
		console.error("error setting api url");
	}

	// TODO less retarded way to pass connection url
	var connUrl = $("body").data("api-url").replace("http", "ws").replace("https", "ws") + $("body").data("conn-path");
	if (!Conn.setUrl(connUrl)) {
		console.error("error setting conn url");
	}

	Conn.connect();

	$(".js-logout-link").on("click", function(event) {
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
			Token.clear();
			location.href = "/";
		}).fail(function(xhr) {
			Util.handleFail(xhr.responseText ? xhr.responseText : xhr);
		});
	});

	$(".js-modal-button").on("click", function(event) {
		event.preventDefault();

		var elem = $(this);
		var dm = elem.data("modal");
		if (!dm) {
			return;
		}

		$(dm).modal("show");
	});

	$(".tabular.menu .item").tab();
});
