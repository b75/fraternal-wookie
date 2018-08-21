"use strict";

var App;

// onload
$(function() {
	let appElem = $("#app");
	Api.setUrl(appElem.data("apiurl"));

	App = new Vue({
		el: "#app",
		data: {
			errors: [],
			infos: []
		},
		created: function() {
		},
		methods: {
			closeError: function(index) {
				this.errors.splice(index, 1);
			},
			addError: function(error) {
				this.errors.push(error && typeof error === "string" ? error : "unknown error");
			},

			closeInfo: function(index) {
				this.infos.splice(index, 1);
			},
			addInfo: function(info) {
				this.infos.push(String(info));
			}
		}
	});
});
