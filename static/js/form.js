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

	$("#group-chat-message-form").form({
		on: "blur",
		fields: {
			"Message": {
				identifier: "Message",
				rules: [
					{
						type: "empty",
						prompt: "Please enter a message"
					}
				],
			}
		},
		onSuccess: function(event, fields) {
			event.preventDefault();
			Util.postJsonForm(event.target);
		},
	});

});
