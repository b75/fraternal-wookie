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
	
	Util.initHtmlElem($("body"));
});
