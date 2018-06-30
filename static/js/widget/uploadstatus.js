"use strict";

(function() {

	var uploadStatusWidgetController = function(widget) {
		var tpl = _.template(Tpl.upload());

		return {
			newUpload: function(upload) {
				var item = $(tpl(upload));
				item.progress({
					autoSuccess: false,
					total: upload.size
				});
				widget.append(item);
			},
			statusChange: function(upload) {
				var item = widget.find('[data-key="' + upload.key + '"]');
				if (!item.length) {
					return;
				}
				if (upload.job.size && upload.job.remaining) {
					var uploaded = upload.job.size - upload.job.remaining;
					item.progress("set progress", uploaded).progress("set active");
				}
				switch (upload.job.status) {
					case 2:
						item.progress("set success");
						break;
					case 4:
						item.progress("set error");
						break;
				}
			}
		};
	};

	// onload
	$(function() {
		$(".js-widget.upload-status-widget").each(function(i, v) {
			var widget = $(v);
			var ctrl = uploadStatusWidgetController(widget);
			widget.data("controller", ctrl);
			$("body").on("new-upload", function(event) {
				ctrl.newUpload(event.upload);
			});
			$("body").on("upload-status-change", function(event) {
				ctrl.statusChange(event.upload);
			});
		});
	});
}());
