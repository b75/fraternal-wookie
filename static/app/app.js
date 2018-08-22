"use strict";

// onload
$(function() {
	let appElem = $("#app");
	Api.setUrl(appElem.data("apiurl"));

	let App = new Vue({
		el: "#app",
		data: {
			errors: [],
			infos: [],
			user: null,
			expiry: null,
			groups: [],
			selectedGroup: null
		},
		mounted: function() {
			this.loadUser();
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
			},
			login: function(tokenData) {
				Token.set(tokenData.Token, tokenData.Expiry);
				this.loadUser();
			},
			logout: function() {
				Token.clear();
				this.user = null;
				this.expiry = null;
			},
			loadUser: function() {
				let that = this;
				Api.call("GET", "/token/info").done(function(result) {
					that.user = result.User;
					that.expiry = result.Payload.exp;
					that.loadGroups();
				});
			},
			loadGroups: function() {
				if (!this.user) {
					return;
				}

				let that = this;
				Api.call("GET", "/user/membergroups", {
					UserId: this.user.Id
				}).done(function(result) {
					that.groups = result;
				}).fail(function(error) {
					that.addError("group load error: " + error);
				});
			},

			selectGroup: function(group) {
				if (!group) {
					return;
				}
				this.selectedGroup = group;
			}
		}
	});
});
