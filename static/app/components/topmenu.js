"use strict";

(function() {

	// BEGIN TEMPLATE
	let tpl = `
<div id="top-menu" class="ui fixed inverted menu">
	<div class="ui container">
		<a class="header item" href="/index">
			<img class="logo" src="/assets/ext/logo.png"/>
			Fraternal Wookie
		</a>
		<div class="ui simple dropdown item">
			Menu <i class="dropdown icon"></i>
			<div class="menu">
				<a class="item" href="/life">Life</a>
				<a class="item" href="/assets/app/app.html">Vue test</a>
			</div>
		</div>
		<div class="right menu">
			<template v-if="user">
				<div class="item">Logged in as &quot;{{ user.Username }}&quot; {{ validUntil }}</div>
				<a class="item" v-on:click.prevent="logout"><i class="lock alternate icon"></i> Log out</a>
			</template>
			<template v-else>
				<a class="item" v-on:click.prevent="showLoginModal"><i class="unlock alternate icon"></i> Log in</a>
			</template>
		</div>
	</div>

	<div id="login-modal" class="ui modal">
		<i class="close icon"></i>
		<div class="header">Log in</div>
		<div class="content">
			<div class="ui raised segment">
				<form id="login-form" class="ui form">
					<div class="field">
						<label>Username</label>
						<input type="text" name="Username" placeholder="Username"/>
					</div>
					<div class="field">
						<label>Password</label>
						<input type="password" name="Password" placeholder="Password"/>
					</div>
				</form>
			</div>
		</div>
		<div class="actions">
			<div class="ui ok blue labeled icon button">
				<i class="unlock icon"></i> Log in
			</div>
		</div>
	</div>
</div>
	`;
	// END TEMPLATE

	Vue.component("app-top-menu", {
		template: tpl,
		props: ["user", "expiry"],
		computed: {
			validUntil: function() {
				if (typeof this.expiry === "number" && this.expiry > 0) {
					let exp = new Date(this.expiry * 1000);

					let h = exp.getHours() < 10 ? "0" + exp.getHours() : exp.getHours();
					let m = exp.getMinutes() < 10 ? "0" + exp.getMinutes() : exp.getMinutes();

					return "until " + h + ":" + m;	// TODO dates
				}
				return "";
			}
		},
		mounted: function() {
			let that = this;

			let loginForm = $("#login-form");
			loginForm.form({
				on: "blur",
				inline: true,
				fields: {
					"Username": {
						identifier: "Username",
						rules: [
							{
								type: "empty",
								prompt: "Please enter a username"
							}
						]
					},
					"Password": {
						identifier: "Password",
						rules: [
							{
								type: "empty",
								prompt: "Please enter a password"
							}
						]
					}
				}
			});

			let loginModal = $("#login-modal");
			loginModal.modal({
				onShow: function() {
					loginForm[0].reset();
				},
				onApprove: function() {
					if (!loginForm.form("is valid")) {
						return false;
					}

					let data = {};
					$.each(loginForm.serializeArray(), function(i, field) {
						data[field.name] = field.value;
					});

					Api.call("POST", "/token/new", data).done(function(result) {
						that.$emit("login", result);
					}).fail(function(error) {
						that.$emit("error", "login failure: " + String(error));
					});
				}
			});
		},
		methods: {
			showLoginModal: function() {
				$("#login-modal").modal("show");
			},

			logout: function() {
				this.$emit("logout");
			}
		}
	});

}());
