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
		}
	};
}());
