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
		},

		file: function(data) {
			let tpl = `
<tr>
	<td class="collapsing js-popup" data-content="${data.Filename}">
		<i class="download icon"></i> <a class="js-download-link" data-file="${data.Hash}">${data.Filename}</a>
	</td>
	<td class="js-popup" data-content="${data.Mime}">${data.Mime}</td>
	<td>${Util.formatFileSize(data.Size)}</td>
</tr>
			`;
			return tpl;
		},

		fileSelection: function() {
			var html = '<div class="item">';
			html += '    <i class="file alternate icon"></i>';
			html += '    <div class="content"><%= filename %> (<%= size %>)</div>';
			html += '   </div>';
			return html;
		},

		fileSelectionTotal: function() {
			var html = '<div class="item">';
			html += '    <div class="content"><b>Total</b> <%= size %></div>';
			html += '   </div>';
			return html;
		}
	};
})();
