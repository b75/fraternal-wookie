"use strict";

var Upload = (function() {
	const BLOCK_SIZE = 1024000;	// 250 * 4096

	const Status = {
		wait: 0,	    // not registered, can not run yet
		running: 1,  // ready to upload / uploading
		finished: 2, // done, all uploaded
		error: 4     // execution stopped because of error condition
	};

	const uploads = new Map();

	let uploadWorker = null;

	let initFile = function(file) {
		if (!file.size) {
			return;
		}
		let d = new Date();
		let key = d.getTime() + "." + d.getMilliseconds() + "." + file.name;
		uploads.set(key, {
			filename: file.name,
			size: file.size,
			remaining: file.size,
			queue: [],
			status: Status.wait,
		});
		let data = {
			Filename: file.name,
			Size: file.size,
		};
		Api.post.uploadNew(data).done(function(result) {
			handleFile(key, file, result);
		}).fail(function(error) {
			Util.handleFail(error);
		});
	};

	let handleFile = function(key, file, upload) {
		let job = uploads.get(key);

		for (let i = 0; i < file.size; i += BLOCK_SIZE) {
			let j = i + BLOCK_SIZE;
			j = j > file.size ? file.size : j;

			let blob = file.slice(i, j);
			job.queue.push(blob);
		}
		job.status = Status.running;
		job.uploadCode = upload.Code;

		uploadWorker.postMessage({
			type: "upload",
			key: key,
			job: job
		});
	};

	uploadWorker = new Worker("/assets/js/worker/upload.js");
	uploadWorker.onmessage = function(e) {
		if (typeof e.data !== "object") {
			console.error("received message from upload worker of type " + typeof e.data);
			return;
		}
		if (!e.data.key || typeof e.data.key !== "string") {
			console.error("invalid upload worker message property key");
			return;
		}
		let job = uploads.get(e.data.key);
		if (typeof e.data.status === "number") {
			job.status = e.data.status;
		}
		if (e.data.error) {
			job.error = e.data.error;
		}
		if (typeof e.data.remaining === "number") {
			job.remaining = e.data.remaining;
		}
	};

	$.when(Token.get()).then(function(token) {
		uploadWorker.postMessage({
			type: "settings",
			token: token,
			url: Api.getUrl(),
		});
	}, function(error) {
		console.error("error getting token:", error);
	});

	return {
		multiple: function(files) {
			if (typeof files !== "object") {
				console.error("Upload.upload called with", typeof files);
				return;
			}
			if (!files.length) {
				return;
			}
			for (let i = 0; i < files.length; i++) {
				initFile(files[i]);
			}
		},

		uploads: function() {
			let res = [];
			for (let [key, data] of uploads) {
				res.push(data);
			}
			return res;
		} 
	}
}());
