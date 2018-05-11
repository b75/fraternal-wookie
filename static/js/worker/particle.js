"use strict";

const PARTICLE_SIZE = 35;
const MAX_BUFFER_SIZE = 100000;

var RunTicker = null;
var Initialized = false;
var Buffer = new ArrayBuffer(1000 * PARTICLE_SIZE);
var ParticleView = new DataView(Buffer);
var Ownership = true;
var IsEmpty = true;
var Changes = [];

var Types = {
	none: 0,
	blast: 1
};

/*
0	x	float64
8	y	float64
16	vx	float64
24	vy	float64
32	alive	uint8
33	iter	uint8
34	type	uint8
*/

const Settings = {
	dragCoefficient: 0.95,
	updateInterval: 20
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
		throw "alloc would exceed max buffer size of " + MAX_BUFFER_SIZE + " bytes";
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
	const numParticles = (Buffer.byteLength / PARTICLE_SIZE)|0;

	let alives = 0;
	for (let i = 0; i < numParticles; i++) {
		let offset = i * PARTICLE_SIZE;
		let alive = ParticleView.getUint8(offset + 32);
		if (!alive) {
			continue;
		}
		alives++;

		/* read */
		let x = ParticleView.getFloat64(offset);
		let y = ParticleView.getFloat64(offset + 8);
		let vx = ParticleView.getFloat64(offset + 16);
		let vy = ParticleView.getFloat64(offset + 24);
		let iter = ParticleView.getUint8(offset + 33);
		let type = ParticleView.getUint8(offset + 34);

		/* update */
		x += vx;
		y += vy;
		vx *= Settings.dragCoefficient;
		vy *= Settings.dragCoefficient;

		alive--;
		iter++;

		/* write */
		ParticleView.setFloat64(offset, x);
		ParticleView.setFloat64(offset + 8, y);
		ParticleView.setFloat64(offset + 16, vx);
		ParticleView.setFloat64(offset + 24, vy);
		ParticleView.setUint8(offset + 32, alive);
		ParticleView.setUint8(offset + 33, iter);
	}

	postState();
	if (!alives) {
		IsEmpty = true;
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
		let alive = ParticleView.getUint8(offset + 32);
		if (alive) {
			continue;
		}

		ParticleView.setFloat64(offset, particles[n].x);
		ParticleView.setFloat64(offset + 8, particles[n].y);
		ParticleView.setFloat64(offset + 16, particles[n].vx);
		ParticleView.setFloat64(offset + 24, particles[n].vy);
		ParticleView.setUint8(offset + 32, particles[n].alive);
		ParticleView.setUint8(offset + 33, 0);
		ParticleView.setUint8(offset + 34, particles[n].type);
		n++;
		IsEmpty = false;
	}

	if (n < particles.length) {
		growBuffer();
		addParticles(particles.slice(n));
	}
}
