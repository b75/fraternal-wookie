"use strict";

var Tpl = (function() {
	return {
		GroupMessage: function() {
			var html = '<div class="comment" data-msg-id="<%- Id %>">';
			html +=    ' <div class="content">';
			html +=    '  <a class="author"><%- Username %></a>';
			html +=    '  <div class="metadata">';
			html +=    '   <span class="date"><%- Ctime %></span>';
			html +=    '  </div>';
			html +=    '  <div class="text"><%- Message %></div>';
			html +=    ' </div>';
			html +=    '</div>';
			return html;
		}
	};
})();
