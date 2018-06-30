"use strict";

const Status = {
	finished: 2, // done, all uploaded
	error: 4     // execution stopped because of error condition
};

const Queue = [];

var RunTicker = setInterval(step, 1000);
var Uploading = false;

const Settings = {
	timeout: 10000,
	fatalErrorCount: 10,
	token: null,
	url: null
};

onmessage = function(e) {
	if (typeof e.data !== "object") {
		console.error("upload worker: received message of type " + typeof e.data);
		return;
	}

	switch (e.data.type) {
		case "settings":
			if (!e.data.token || typeof e.data.token !== "string") {
				console.error("upload worker: invalid settings message property token");
				return;
			}
			if (!e.data.url || typeof e.data.url !== "string") {
				console.error("upload worker: invalid settings message property url");
				return;
			}
			Settings.token = e.data.token;
			Settings.url = e.data.url;
			break;
		case "upload":
			if (!e.data.key || typeof e.data.key !== "string") {
				console.error("upload worker: invalid upload message property key");
				return;
			}
			if (!e.data.job || typeof e.data.job !== "object") {
				console.error("upload worker: invalid upload message property job");
				return;
			}
			Queue.push(e.data);
			break;
		default:
			console.error("upload worker: unknown message type", e.data.type);
	}	


}

onerror = function(e) {
	console.error("upload worker: fatal", e);
	close();
}

function step() {
	if (Uploading) {
		return;
	}
	if (!Queue.length) {
		return;
	}

	if (!Settings.token || !Settings.url) {
		throw "upload worker: not initialized";
	}

	let key = Queue[0].key;
	let job = Queue[0].job;

	if (!job.queue.length) {
		Queue.shift();
		postMessage({
			key: key,
			status: Status.finished
		});
		return;
	}
	if (job.errorCount >= Settings.fatalErrorCount) {
		Queue.shift();
		postMessage({
			key: key,
			status: Status.error,
			error: job.error,
		});
		return;
	}

	let blob = job.queue[0];

	let rq = new XMLHttpRequest();
	rq.timeout = Settings.timeout;
	rq.open("POST", Settings.url + "/uploadappend?Code=" + job.uploadCode, true);
	rq.setRequestHeader("Content-Type", "application/octet-stream");
	rq.setRequestHeader("Authorization", "Bearer " + Settings.token);
	rq.onerror = function(event) {
		Uploading = false;
		handleFail(key, job, rq.statusText);
	};
	rq.onload = function(event) {
		if (rq.readyState === 4) {
			Uploading = false;
			if (rq.status < 200 || rq.status > 299) {
				handleFail(key, job, rq.statusText);
				return;
			}
			let response = JSON.parse(rq.response);
			if (typeof response !== "object") {
				handleFail(key, job, rq.responseText);
				return;
			}
			if (response.Success !== true) {
				handleFail(key, job, response.Error);
				return;
			}
			job.queue.shift();

			let remaining = 0;
			for (let i = 0; i < job.queue.length; i++) {
				remaining += job.queue[i].size;
			}
			postMessage({
				key: key,
				remaining: remaining,
			});
		}
	};

	Uploading = true;
	rq.send(blob);
}

function handleFail(key, job, error) {
	console.error("upload worker xhr error:", error);
	job.errorCount = job.errorCount ? job.errorCount + 1 : 1;
	job.error = error;
}
