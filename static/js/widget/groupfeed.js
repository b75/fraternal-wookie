"use strict";

(function() {

	var groupFeedWidgetController = function(widget) {
		var group = widget.data("group-id");
		var lastFeed = widget.children(".group-feed").first().data("feed-id");
		var latest = lastFeed ? lastFeed : 0;
		var tpl = _.template(Tpl.groupFeed());

		return {
			update: _.throttle(function() {
				Api.get.groupFeeds(group, latest).done(function(result) {
					$.each(result, function(i, feed) {
						if (feed.Id > latest) {
							latest = feed.Id;
						}
						var first = widget.children(".group-feed").first();
						if (first.length) {
							first.before(tpl(feed));
						} else {
							widget.append(tpl(feed));
						}
					});
				}).fail(function(error) {
					Util.handleFail(error);
				});
			}, 250)
		};
	};

	// onload
	$(function() {
		$(".js-widget.group-feed-widget").each(function(i, v) {
			var widget = $(v);
			widget.data("controller", groupFeedWidgetController(widget));
		});

		$(".js-widget.group-feed-widget").on("js-widget-refresh", function(event) {
			event.preventDefault();
			$(this).data("controller").update();
		});
	});
}());
