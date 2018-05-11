"use strict";

const Colors = {
	none: 0,
	red: 1,
	green: 2,
	blue: 4,
	wall: 8,
	extractor: 16
};
Colors.lifeMask = Colors.red | Colors.green | Colors.blue;
Colors.structureMask = Colors.wall | Colors.extractor;

const Settings = {
	gridWidth: 200,
	gridHeight: 200,
	lifeStep: 10,
	blastStructureCoefficient: 80
};

var RunTicker = null;
var Initialized = false;
var Ownership = true;
var LogPerformance = false;
var Changes = [];

var Buffers = {
	color: null,
	alive: null,
	nextAlive: null
};


onmessage = function(e) {
	if (typeof e.data !== "object") {
		console.error("grid worker: received message of type " + typeof e.data);
		return;
	}
	switch (e.data.type) {
		case "load":
			load();
			break;
		case "run":
			if (RunTicker) {
				break;
			}
			RunTicker = setInterval(step, 200);
			break;
		case "stop":
			if (!RunTicker) {
				break;
			}
			clearInterval(RunTicker);
			RunTicker = null;
			break;
		case "bufreturn":
			Buffers.color = e.data.buffers.color;
			Buffers.alive = e.data.buffers.alive;
			Ownership = true;
			break;
		case "changes":
			for (let i = 0; i < e.data.changes.length; i++) {
				Changes.push(e.data.changes[i]);
			}
			break;
		default:
			console.error("grid worker: unknown message type", e.data.type);
	}
};

onerror = function(e) {
	console.error("grid worker: fatal", e);
	close();
};

function load() {
	if (!Ownership) {
		throw "load without buf ownership";
	}
	var size = Settings.gridWidth * Settings.gridHeight;
	var rand;

	Buffers.color = new Uint8Array(size);
	Buffers.alive = new Uint8ClampedArray(size);
	Buffers.nextAlive = new Uint8ClampedArray(size);

	for (var offset = 0; offset < size; offset++) {
		rand = Math.random();
		if (rand < 0.03) {
			Buffers.alive[offset] = 255;
			Buffers.color[offset] = Colors.blue;
		} else if (rand < 0.35) {
			Buffers.alive[offset] = 255;
			Buffers.color[offset] = Colors.wall;
		}
	}
	
	Initialized = true;
	postState();
}

function step() {
	if (!Ownership) {
		return;
	}
	if (!Initialized) {
		return;
	}

	if (LogPerformance) {
		console.time("grid worker step");
	}
	var x, y, nx, ny, gx, gy;
	var i, offset, rand, neighbors, neighborAlives;

	if (Changes.length > 0) {
		for (i = 0; i < Changes.length; i++) {
			offset = Changes[i].x * Settings.gridWidth + Changes[i].y;
			if (offset < 0 || offset >= Buffers.alive.length) {
				continue;
			}
			Buffers.alive[offset] = typeof Changes[i].alive === "number" ? Changes[i].alive : Buffers.alive[offset];
			Buffers.color[offset] = typeof Changes[i].color === "number" ? Changes[i].color : Buffers.color[offset];
			if (typeof Changes[i].blast === "number" && Changes[i].blast > 0) {
				if (Buffers.color[offset] & Colors.lifeMask) {
					Buffers.alive[offset] = 0;
				} else if (Buffers.color[offset] & Colors.structureMask) {
					Buffers.alive[offset] -= Changes[i].blast * Settings.blastStructureCoefficient;
				}
			}
		}
		Changes = [];
	}

	/* first pass */
	for (x = 0; x < Settings.gridWidth; x++) {
		for (y = 0; y < Settings.gridHeight; y++) {
			neighbors = 0;
			neighborAlives = 0;

			/* neighborhood */
			for (nx = -1; nx <= 1; nx++) {
				for (ny = -1; ny <= 1; ny++) {
					if (nx === 0 && ny === 0) {
						continue;
					}
					gx = x + nx;
					gy = y + ny;
					if (gx < 0 || gy < 0 || gx >= Settings.gridWidth || gy >= Settings.gridHeight) {
						continue;
					}

					offset = gx * Settings.gridWidth + gy;
					if (Buffers.alive[offset] && Buffers.color[offset] & Colors.lifeMask) {
						neighbors++;
						neighborAlives += Buffers.alive[offset] * 0.01;
					}
				}
			}

			offset = x * Settings.gridWidth + y;
			if (Buffers.alive[offset]) {	// alive cells
				if (Buffers.color[offset] & Colors.lifeMask) {	// life
					rand = (Math.random() * Settings.lifeStep)|0;
					Buffers.nextAlive[offset] = neighbors < 2 || neighbors > 3 ? Buffers.alive[offset] - rand : Buffers.alive[offset] + rand;
				} else if (Buffers.color[offset] & Colors.structureMask) {	// structures
					Buffers.nextAlive[offset] = Buffers.alive[offset] - neighborAlives|0;
				}
			} else { 
				if (neighbors === 3) {		// dead cells, birth
					rand = (Math.random() * Settings.lifeStep)|0;
					Buffers.nextAlive[offset] = rand;
					Buffers.color[offset] = Colors.blue;
				} else {		// dead cells should stay dead
					Buffers.nextAlive[offset] = 0;
				}
			}
		}
	}

	/* second pass */
	for (offset = 0; offset < Buffers.alive.length; offset++) {
		Buffers.alive[offset] = Buffers.nextAlive[offset];
	}

	postState();
	if (LogPerformance) {
		console.timeEnd("grid worker step");
	}
}

function postState() {
	if (!Ownership) {
		throw "postState without buf ownership";
	}
	if (!Initialized) {
		return;
	}
	Ownership = false;
	postMessage({
		type: "update",
		buffers: {
			color: Buffers.color,
			alive: Buffers.alive
		}
	}, [Buffers.color.buffer, Buffers.alive.buffer]);
}
