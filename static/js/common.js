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
			location.reload(true);
		}).fail(function(xhr) {
			Util.handleFail(xhr.responseText ? xhr.responseText : xhr);
		});
	});

	$(".tabular.menu .item").tab();


	// widgets TODO move to own .js
	$(".js-widget.group-chat-widget").on("js-widget-refresh", function(event) {
		event.preventDefault();
		var widget = $(this);

		var after = widget.children().last().data("msg-id");	// latest displayed message

		Api.get.groupMessages(widget.data("group-id"), after).done(function(result) {

			$.each(result, function(i, msg) {
				var html = '<div class="comment" data-msg-id="' + msg.Id + '">';
				html +=    ' <div class="content">';
				html +=    '  <a class="author">' + msg.Username  + '</a>';
				html +=    '   <div class="metadata">';
				html +=    '    <span class="date">' + msg.Ctime + '</span>';
				html +=    '   </div>';
				html +=    '   <div class="text">' + msg.Message + '</div>';
				html +=    ' </div>';
				html +=    '</div>';
				widget.append(html);
			});

		}).fail(function(error) {
			Util.handleFail(error);
		});
	});

});
