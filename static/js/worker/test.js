"use strict";

var Buffer = new Uint8Array(1000);

onmessage = function(e) {
	Buffer = e.data;
	postBuffer();
}

onerror = function(e) {
	console.error("grid worker: fatal", e);
	close();
};

function postBuffer() {
	//postMessage(Buffer);
	postMessage(Buffer, [Buffer.buffer]);
}

postBuffer();
