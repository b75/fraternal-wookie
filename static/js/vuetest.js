"use strict";

var MainContainer;
var Menu;

// onload
$(function() {
	MainContainer = new Vue({
		el: "#main-container",
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

	Menu = new Vue({
		el: "#top-menu",
		data: {
			user: null
		},
		created: function() {},
		methods: {}
	});

	$.when(Token.load()).then(function(token) {
		MainContainer.addInfo("Token valid until " + new Date(token.Expiry * 1000));
	}, function(error) {
		MainContainer.addError("Token load failed: " + String(error));
	});
});
