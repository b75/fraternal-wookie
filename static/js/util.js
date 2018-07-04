"use strict";

var Util = (function() {
	const KiloByte = 1024;
	const MegaByte = 1024 * KiloByte;
	const GigaByte = 1024 * MegaByte;

	return {
		KiloByte: KiloByte,
		MegaByte: MegaByte,
		GigaByte: GigaByte,

		handleFail: function(error) {
			console.error(error);
		},

		formatFileSize: function(size) {
			if (typeof size !== "number" || !(size >= 0)) {
				return;
			}

			if (size < KiloByte) {
				return size.toFixed(0) + " B";
			}
			if (size < MegaByte) {
				size /= KiloByte;
				return size.toFixed(2) + " kB";
			}
			if (size < GigaByte) {
				size /= MegaByte;
				return size.toFixed(2) + " MB";
			}
			size /= GigaByte;
			return size.toFixed(2) + " GB";
		},

		initHtmlElem: function(elem) {
			elem.find(".js-logout-link").on("click", function(event) {
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

			elem.find(".js-download-link").on("click", function(event) {
				event.preventDefault();

				var link = $(this);
				var file = link.data("file");
				if (!file) {
					return;
				}

				Api.post.downloadNew(file).done(function(response) {
					var url = Api.getUrl() + '/download?Code=' + response.Code;
					window.open(url);
				}).fail(function(error) {
					Util.handleFail(error);
				});
			});

			elem.find(".js-modal-button").on("click", function(event) {
				event.preventDefault();

				var elem = $(this);
				var dm = elem.data("modal");
				if (!dm) {
					return;
				}

				$(dm).modal("show");
			});

			elem.find(".tabular.menu .item").tab();
			elem.find(".ui.dropdown").dropdown("restore placeholder text");
			elem.find(".js-popup").popup();
		}
	};
}());
