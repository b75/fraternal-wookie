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
				]
			}
		},
		onSuccess: function(event, fields) {
			event.preventDefault();

			var form = $(event.target);
			if (!form.length) {
				return;
			}

			var data = {};
			$.each(form.serializeArray(), function(i, field) {
				data[field.name] = field.value;
			});

			Api.post.groupMessageNew(form.data("group-id"), data).done(function(result) {
				form.find("textarea").val("");
				$(form.data("widget")).trigger({
					type: "js-widget-refresh"
				})
			}).fail(function(error) {
				form.form("add errors", [error]);
			});
		},
	});

	$("#group-detail-form").form({
		on: "blur",
		inline: true,
		fields: {
			"Name": {
				identifier: "Name",
				rules: [
					{
						type: "empty",
						prompt: "Please enter a name"
					}
				]
			},
			"Description": {
				identifier: "Description",
				rules: [
					{
						type: "empty",
						prompt: "Please enter a description"
					}
				]
			}
		}
	});

});
