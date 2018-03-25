"use strict";

// onload
$(function() {
	$("#login-form").form({
		on: "blur",
		fields: {
			"Username": {
				identifier: "Username",
				rules: [
					{
						type: "empty",
						prompt: "Please enter a username",
					}
				]
			},
			"Password": {
				identifier: "Password",
				rules: [
					{
						type: "empty",
						prompt: "Please enter a password",
					}
				]
			}
		}
	});
});
