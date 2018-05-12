"use strict";

const PARTICLE_SIZE = 19;
const MAX_BUFFER_SIZE = 304000;	// 16x original size
const LOG_PERFORMANCE = false;

var RunTicker = null;
var Initialized = false;
var Buffer = new ArrayBuffer(1000 * PARTICLE_SIZE);
var ParticleView = new DataView(Buffer);
var Ownership = true;
var IsEmpty = true;
var Changes = [];

var Types = {
	none: 0,
	blast: 1,
	napalm: 2,
	fireWhite: 3,
	fireYellow: 4,
	fireRed: 5,
	thermobaric: 6,
	ionWhite: 7,
	ionBlue: 8,
	inhibitor: 9
};

/*
0	x	float32
4	y	float32
8	vx	float32
12	vy	float32
16	alive	uint8
17	iter	uint8
18	type	uint8
*/

const Settings = {
	dragCoefficient: 0.95,
	updateInterval: 20,
	checkNewParticles: false
};

onmessage = function(e) {
	if (typeof e.data !== "object") {
		console.error("particle worker: received message of type " + typeof e.data);
		return;
	}
	switch (e.data.type) {
		case "run":
			if (RunTicker) {
				break;
			}
			RunTicker = setInterval(step, Settings.updateInterval);
			break;
		case "stop":
			if (!RunTicker) {
				break;
			}
			clearInterval(RunTicker);
			RunTicker = null;
			break;
		case "bufreturn":
			ParticleView = e.data.buffers.particles;
			Buffer = ParticleView.buffer;
			Ownership = true;
			break;
		case "changes":
			for (let i = 0; i < e.data.changes.length; i++) {
				Changes.push(e.data.changes[i]);
			}
			break;
		default:
			console.error("particle worker: unknown message type", e.data.type);
	}
};

onerror = function(e) {
	console.error("particle worker: fatal", e);
	close();
}

function postState() {
	if (!Ownership) {
		throw "postState without buf ownership";
	}
	Ownership = false;
	postMessage({
		type: "update",
		buffers: {
			particles: ParticleView
		}
	}, [ParticleView.buffer]);
}

function growBuffer() {
	if (!Ownership) {
		throw "growBuffer without buf ownership";
	}
	let newSize = 2 * Buffer.byteLength;
	if (newSize > MAX_BUFFER_SIZE) {
		throw "alloc of " + newSize + " bytes would exceed max buffer size of " + MAX_BUFFER_SIZE + " bytes";
	}
	let newBuf = new ArrayBuffer(newSize);
	let dstView = new Uint8Array(newBuf);
	let srcView = new Uint8Array(Buffer);
	dstView.set(srcView, 0);	// memcpy
	Buffer = newBuf;
	ParticleView = new DataView(Buffer);
	console.log("particle worker: buffer size", newSize, "bytes");
}

function step() {
	if (!Ownership) {
		return;
	}
	if (Changes.length) {
		handleChanges();
	}
	if (IsEmpty) {
		return;
	}
	if (LOG_PERFORMANCE) {
		console.time("particle worker step");
	}
	const numParticles = (Buffer.byteLength / PARTICLE_SIZE)|0;

	let alives = 0;
	let newParticles = null;
	for (let i = 0; i < numParticles; i++) {
		let offset = i * PARTICLE_SIZE;
		let alive = ParticleView.getUint8(offset + 16);
		if (!alive) {
			continue;
		}
		alives++;

		/* read */
		let x = ParticleView.getFloat32(offset);
		let y = ParticleView.getFloat32(offset + 4);
		let vx = ParticleView.getFloat32(offset + 8);
		let vy = ParticleView.getFloat32(offset + 12);
		let iter = ParticleView.getUint8(offset + 17);
		let type = ParticleView.getUint8(offset + 18);

		/* update */
		x += vx;
		y += vy;
		vx *= Settings.dragCoefficient;
		vy *= Settings.dragCoefficient;

		alive--;
		iter++;

		switch (type) {
			case Types.napalm:
				if (Math.random() < 0.3) {
					let dir = Math.random() * 2 * Math.PI;
					let velocity = Math.random() * 10;
					newParticles = newParticles || [];
					newParticles.push({
						x: x,
						y: y,
						vx: vx + Math.cos(dir) * velocity,
						vy: vy + Math.sin(dir) * velocity,
						alive: 30,
						type: Types.fireWhite
					});
				}
				break;
			case Types.fireWhite:
				if (iter > 4) {
					type = Types.fireYellow;
				}
				break;
			case Types.fireYellow:
				if (iter > 14) {
					type = Types.fireRed;
				}
				break;
			case Types.thermobaric:
				if (!alive) {
					newParticles = newParticles || [];
					for (let j = 0; j < 100; j++) {
						let dir = Math.random() * 2 * Math.PI;
						let velocity = 15 + Math.random() * 25;
						newParticles.push({
							x: x,
							y: y,
							vx: vx + Math.cos(dir) * velocity,
							vy: vy + Math.sin(dir) * velocity,
							alive: 40,
							type: Types.blast
						});
					}
				}
				break;
			case Types.ionWhite:
				if (iter > 2) {
					type = Types.ionBlue;
				}
				break;
		}

		/* write */
		ParticleView.setFloat32(offset, x);
		ParticleView.setFloat32(offset + 4, y);
		ParticleView.setFloat32(offset + 8, vx);
		ParticleView.setFloat32(offset + 12, vy);
		ParticleView.setUint8(offset + 16, alive);
		ParticleView.setUint8(offset + 17, iter);
		ParticleView.setUint8(offset + 18, type);
	}

	if (newParticles && newParticles.length) {
		addParticles(newParticles);
		alives += newParticles.length;
	}

	postState();
	if (!alives) {
		IsEmpty = true;
	}
	if (LOG_PERFORMANCE) {
		console.timeEnd("particle worker step");
	}
}

/*
n
x, y
minVelocity, velocitySpread
minAlive, aliveSpread
type
*/

function handleChanges() {
	if (!Ownership) {
		throw "handleChanges without buf ownership";
	}
	let particles = [];
	for (let i = 0; i < Changes.length; i++) {
		let c = Changes[i];
		for (let n = 0; n < c.n; n++) {
			let dir = Math.random() * 2 * Math.PI;
			let r = c.minVelocity + Math.random() * c.velocitySpread;
			particles.push({
				x: c.x,
				y: c.y,
				vx: r * Math.cos(dir),
				vy: r * Math.sin(dir),
				alive: c.minAlive + Math.random() * c.aliveSpread,
				type: c.type
			});
		}
	}
	addParticles(particles);
	Changes = [];
}

function addParticles(particles) {
	if (!Ownership) {
		throw "addParticle without buf ownership";
	}
	const numParticles = (Buffer.byteLength / PARTICLE_SIZE)|0;

	let n = 0;
	for (let i = 0; i < numParticles && n < particles.length; i++) {
		let offset = i * PARTICLE_SIZE;
		let alive = ParticleView.getUint8(offset + 16);
		if (alive) {
			continue;
		}

		if (Settings.checkNewParticles) {
			if (typeof particles[n].x !== "number") {
				throw "addParticles: invalid property x: " + JSON.stringify(particles[n]);
			}
			if (typeof particles[n].y !== "number") {
				throw "addParticles: invalid property y: " + JSON.stringify(particles[n]);
			}
			if (typeof particles[n].vx !== "number") {
				throw "addParticles: invalid property vx: " + JSON.stringify(particles[n]);
			}
			if (typeof particles[n].vy !== "number") {
				throw "addParticles: invalid property vy: " + JSON.stringify(particles[n]);
			}
			if (typeof particles[n].alive !== "number" || particles[n].alive <= 0 || particles[n].alive > 255) {
				throw "addParticle: invalid property alive: " + JSON.stringify(particles[n]);
			}
			if (typeof particles[n].type !== "number" || particles[n].type <= 0 || particles[n].type > 255) {
				throw "addParticle: invalid property type: " + JSON.stringify(particles[n]);
			}
		}

		ParticleView.setFloat32(offset, particles[n].x);
		ParticleView.setFloat32(offset + 4, particles[n].y);
		ParticleView.setFloat32(offset + 8, particles[n].vx);
		ParticleView.setFloat32(offset + 12, particles[n].vy);
		ParticleView.setUint8(offset + 16, particles[n].alive);
		ParticleView.setUint8(offset + 17, 0);
		ParticleView.setUint8(offset + 18, particles[n].type);
		n++;
		IsEmpty = false;
	}

	if (n < particles.length) {
		growBuffer();
		addParticles(particles.slice(n));
	}
}
