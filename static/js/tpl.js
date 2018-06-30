"use strict";

var Tpl = (function() {
	return {
		groupMessage: function() {
			var html = '<div class="comment" data-msg-id="<%= Id %>">';
			html +=    ' <div class="content">';
			html +=    '  <a class="author"><%= Username %></a>';
			html +=    '  <div class="metadata">';
			html +=    '   <span class="date"><%= Ctime %></span>';
			html +=    '  </div>';
			html +=    '  <div class="text"><%= Message %></div>';
			html +=    ' </div>';
			html +=    '</div>';
			return html;
		},

		groupFeed: function() {
			var html = '<div class="sixteen wide column group-feed" data-feed-id="<%= Id %>">';
			html +=    ' <div class="ui attached segment">';
			html +=    '  <h5 class="ui top attached header"><%= Header %></h5>';
			html +=    '  <div class="ui teal attached segment">';
			html +=    '   <p><%= Body %></p>';
			html +=    '  </div>';
			html +=    '  <div class="ui bottom attached segment">';
			html +=    '   <p><%= Ctime %></p>';
			html +=    '  </div>';
			html +=    ' </div>';
			html +=    ' <div class="ui bottom attached right aligned segment">';
			html +=    ' </div>';
			html +=    '</div>';
			return html;
		},

		upload: function() {
			var html = '<div class="ui progress" data-key="<%= key %>">';
			html +=    ' <div class="bar">';
			html +=    '  <div class="progress"></div>';
			html +=    ' </div>';
			html +=    ' <div class="label"><%= filename %></div>';
			html +=    '</div>';
			return html;
		}
	};
})();
