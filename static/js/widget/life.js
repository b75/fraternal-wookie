"use strict";

(function() {

	/* constants */
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

	const ParticleTypes = {
		none: 0,
		blast: 1
	};
	ParticleTypes.gridActiveMask = ParticleTypes.blast;

	const PARTICLE_SIZE = 35;


	var lifeController = function(widget) {
		var canvas = $(widget.data("canvas"));
		if (canvas.length !== 1) {
			console.error("no canvas element found by", wdiget.data("canvas"));
			return;
		}
		var ctx = canvas[0].getContext("2d");
		if (!ctx) {
			console.error("no context", ctx);
			return;
		}

		var width = canvas.width();
		var height = canvas.height();

		if (typeof width !== "number" || width <= 0) {
			console.error("canvas width error");
			return;
		}
		if (typeof height !== "number" || height <= 0) {
			console.error("canvas height error");
			return;
		}
		canvas[0].width = width;
		canvas[0].height = height;

		var lifeWorker = null;
		var particleWorker = null;
		var grid = [];
		var particles = [];
		var particleSets = new Map();
		particleSets.set(ParticleTypes.blast, new Set());
		var markers = [];
		var cellSize = 10;
		var gridWidth = 200;
		var gridHeight = 200;
		var stats = {
			updateNumber: 0,
			updateGridLast: 0
		};
		var resources = 15000;	// TODO 150
		var resourceField = $(".js-widget-field.life-widget.resources");

		resourceField.html(Math.floor(resources));

		/* grid init */
		for (var x = 0; x < gridWidth; x++) {
			grid[x] = [];
			for (var y = 0; y < gridHeight; y++) {
				grid[x][y] = {
					alive: 0,
					inhibitor: 0,
					resource: 0,
					color: Colors.none
				};
			}
		}
		
		var life2hex = function(life) {
			var hex = life.toString(16);
			return hex.length < 2 ? "0" + hex : hex;
		}

		var s2gx = function(x) {
			return Math.floor(x / cellSize) + origin.x;
		};
		var s2gy = function(y) {
			return Math.floor(y  / cellSize) + origin.y;
		};

		var mouse = {
			color: Colors.blue,
			tool: "draw"
		};
		var kb = {};
		var updateTicker = null;
		var origin = {
			x: 0,
			y: 0
		};
		canvas[0].addEventListener("mousemove", function(event) {
			var bbox = this.getBoundingClientRect();
			var x = event.clientX - bbox.left;
			var y = event.clientY - bbox.top;
			mouse.px = x;
			mouse.py = y;
			mouse.x = s2gx(x);
			mouse.y = s2gy(y);

			if (!updateTicker && mouse.tool === "draw" && (mouse.left || mouse.right)) {
				if (mouse.x >= 0 && mouse.x < gridWidth && mouse.y >= 0 && mouse.y < gridHeight) {
					grid[mouse.x][mouse.y].alive = mouse.left ? 100 : 0;
					grid[mouse.x][mouse.y].color = mouse.color;
				}
			} else if (updateTicker && mouse.left) {
				switch (mouse.tool) {
					case "wall":
						if (mouse.x < 0 || mouse.x >= gridWidth || mouse.y < 0 || mouse.y >= gridHeight) {
							break
						}
						var redundant = false;
						for (var i = 0; i < markers.length; i++) {
							if (markers[i].type !== "wall") {
								continue;
							}
							if (markers[i].x === mouse.x && markers[i].y === mouse.y) {
								redundant = true;
								break;
							}
						}
						if (redundant) {
							break;
						}
						if (!ctrl.getResource(1)) {
							break;
						}
						var marker = {
							type: "wall",
							x: mouse.x,
							y: mouse.y,
							alive: true
						};
						markers.push(marker);
						(function() {
							var x = mouse.x;
							var y = mouse.y;
							setTimeout(function() {
								marker.alive = false;
								if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
									return;
								}
								lifeWorker.postMessage({
									type: "changes",
									changes: [
										{
											x: x,
											y: y,
											alive: 255,
											color: Colors.wall
										}
									]
								});
							}, 1000);
						})();
						break;
					case "ion":
						if (mouse.x < 0 || mouse.x >= gridWidth || mouse.y < 0 || mouse.y >= gridHeight) {
							break
						}
						if (!ctrl.getResource(1)) {
							break;
						}
						var marker = {
							type: "ion",
							x: mouse.x,
							y: mouse.y,
							alive: true
						};
						markers.push(marker);
						(function() {
							var x = mouse.x * cellSize + 0.5 * cellSize;
							var y = mouse.y * cellSize + 0.5 * cellSize;
							setTimeout(function() {
								marker.alive = false;
								for (var i = 0; i < 10; i++) {
									var dir = Math.random() * 2 * Math.PI;
									var velocity = Math.random() < 0.8 ? 25 : 10;
									if (!particles.ion) {
										particles.ion = [];
									}
									particles.ion.push({
										x: x,
										y: y,
										vx: Math.cos(dir) * velocity,
										vy: Math.sin(dir) * velocity,
										alive: 5
									});
								}
							}, 1000);
						})();
						break;
				}
			}
			ctrl.draw();
		});

		canvas[0].addEventListener("mousedown", function(event) {
			if (event.buttons & 1) {
				mouse.left = true;
			}
			if (event.buttons & 2) {
				mouse.right = true;
			}
			if (!updateTicker && mouse.tool === "draw" && (mouse.left || mouse.right)) {
				if (mouse.x >= 0 && mouse.x < gridWidth && mouse.y >= 0 && mouse.y < gridHeight) {
					grid[mouse.x][mouse.y].alive = mouse.left ? 100 : 0;
					grid[mouse.x][mouse.y].color = mouse.color;
				}
				ctrl.draw();
			} else if (updateTicker && mouse.left) {
				switch (mouse.tool) {
					case "cluster":
						if (!ctrl.getResource(100)) {
							break;
						}
						var marker = {
							type: "cluster_bomb",
							x: mouse.x,
							y: mouse.y,
							alive: true,
							iter: 40
						};
						markers.push(marker);
						for (var i = 0; i < 5; i++) {
							var cdir = Math.random() * 2 * Math.PI;
							var cr = Math.random() * 150;
							var cx = mouse.x * cellSize + Math.cos(cdir) * cr;
							var cy = mouse.y * cellSize + Math.sin(cdir) * cr;
							(function() {
								var ccx = cx;
								var ccy = cy;
								setTimeout(function() {
									marker.alive = false;
									particleWorker.postMessage({
										type: "changes",
										changes: [
											{
												n: 80,
												x: ccx,
												y: ccy,
												minVelocity: 22.5,
												velocitySpread: 5,
												minAlive: 20,
												aliveSpread: 0,
												type: 1
											},
											{
												n: 20,
												x: ccx,
												y: ccy,
												minVelocity: 7.5,
												velocitySpread: 5,
												minAlive: 20,
												aliveSpread: 0,
												type: 1
											}
										]
									});
								}, Math.floor(500 + Math.random() * 500));	// TODO 5000 + 500
							})();
						}
						break;
					case "napalm":
						if (!ctrl.getResource(150)) {
							break;
						}
						var marker = {
							type: "napalm",
							x: mouse.x,
							y: mouse.y,
							alive: true,
							iter: 40
						};
						markers.push(marker);
						(function() {
							var cdir = Math.random() * 2 * Math.PI;
							var cr = Math.random() * 90;
							var cx = mouse.x * cellSize + Math.cos(cdir) * cr;
							var cy = mouse.y * cellSize + Math.sin(cdir) * cr;
							setTimeout(function() {
								marker.alive = false;
								for (var i = 0; i < 30; i++) {
									var dir = Math.random() * 2 * Math.PI;
									var velocity = Math.random() * 10;
									if (!particles.napalm) {
										particles.napalm = [];
									}
									particles.napalm.push({
										x: cx,
										y: cy,
										vx: Math.cos(dir) * velocity,
										vy: Math.sin(dir) * velocity,
										alive: 200 + 200 * Math.random()
									});
								}
							}, Math.floor(5000 + Math.random() * 1000));
						})();
						break;
					case "thermobaric":
						if (!ctrl.getResource(2000)) {
							break;
						}
						var marker = {
							type: "thermobaric",
							x: mouse.x,
							y: mouse.y,
							alive: true,
							iter: 60
						};
						markers.push(marker);
						(function() {
							var cdir = Math.random() * 2 * Math.PI;
							var cr = Math.random() * 100;
							var cx = mouse.x * cellSize + Math.cos(cdir) * cr;
							var cy = mouse.y * cellSize + Math.sin(cdir) * cr;
							setTimeout(function() {
								marker.alive = false;
								for (var i = 0; i < 100; i++) {
									var dir = Math.random() * 2 * Math.PI;
									var velocity = Math.random() * 15;
									if (!particles.thermobaric) {
										particles.thermobaric = [];
									}
									particles.thermobaric.push({
										x: cx,
										y: cy,
										vx: Math.cos(dir) * velocity,
										vy: Math.sin(dir) * velocity,
										alive: 100 + Math.random() * 20
									});
								}
							}, Math.floor(20000 + Math.random() * 5000));
						})();
						break;
					case "wall":
						if (mouse.x < 0 || mouse.x >= gridWidth || mouse.y < 0 || mouse.y >= gridHeight) {
							break
						}
						var redundant = false;
						for (var i = 0; i < markers.length; i++) {
							if (markers[i].type !== "wall") {
								continue;
							}
							if (markers[i].x === mouse.x && markers[i].y === mouse.y) {
								redundant = true;
								break;
							}
						}
						if (redundant) {
							break;
						}
						if (!ctrl.getResource(1)) {
							break;
						}
						var marker = {
							type: "wall",
							x: mouse.x,
							y: mouse.y,
							alive: true
						};
						markers.push(marker);
						(function() {
							var x = mouse.x;
							var y = mouse.y;
							setTimeout(function() {
								marker.alive = false;
								if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
									return;
								}
								lifeWorker.postMessage({
									type: "changes",
									changes: [
										{
											x: x,
											y: y,
											alive: 255,
											color: Colors.wall
										}
									]
								});
							}, 1000);
						})();
						break;
					case "harvest":
						if (mouse.x < 0 || mouse.x >= gridWidth || mouse.y < 0 || mouse.y >= gridHeight) {
							break
						}
						if (!grid[mouse.x][mouse.y].resource) {
							break;
						}
						var redundant = false;
						for (var i = 0; i < markers.length; i++) {
							if (markers[i].type !== "harvest") {
								continue;
							}
							if (markers[i].x === mouse.x && markers[i].y === mouse.y) {
								redundant = true;
								break;
							}
						}
						if (redundant) {
							break;
						}
						if (!ctrl.getResource(100)) {
							break;
						}
						var marker = {
							type: "harvest",
							x: mouse.x,
							y: mouse.y,
							alive: true,
							iter: 30
						};
						markers.push(marker);
						(function() {
							var x = mouse.x;
							var y = mouse.y;
							setTimeout(function() {
								marker.alive = false;
								if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
									return;
								}
								grid[x][y].alive = 100;
								grid[x][y].color = Colors.extractor;
							}, 10000);
						})();
						break;
					case "inhibitor":
						if (!ctrl.getResource(50)) {
							break;
						}
						var marker = {
							type: "inhibitor",
							x: mouse.x,
							y: mouse.y,
							alive: true,
							iter: 40
						};
						markers.push(marker);
						(function() {
							var cdir = Math.random() * 2 * Math.PI;
							var cr = Math.random() * 30;
							var cx = mouse.x * cellSize + Math.cos(cdir) * cr;
							var cy = mouse.y * cellSize + Math.sin(cdir) * cr;
							setTimeout(function() {
								marker.alive = false;
								for (var i = 0; i < 40; i++) {
									var dir = Math.random() * 2 * Math.PI;
									var velocity = Math.random() * 8;
									if (!particles.inhibitor) {
										particles.inhibitor = [];
									}
									particles.inhibitor.push({
										x: cx,
										y: cy,
										vx: Math.cos(dir) * velocity,
										vy: Math.sin(dir) * velocity,
										alive: 80 + 50 * Math.random()
									});
								}
							}, Math.floor(3000 + Math.random() * 500));
						})();
						break;
					case "ion":
						if (!ctrl.getResource(1)) {
							break;
						}
						var marker = {
							type: "ion",
							x: mouse.x,
							y: mouse.y,
							alive: true,
						};
						markers.push(marker);
						(function() {
							var x = mouse.x * cellSize + 0.5 * cellSize;
							var y = mouse.y * cellSize + 0.5 * cellSize;
							setTimeout(function() {
								marker.alive = false;
								for (var i = 0; i < 10; i++) {
									var dir = Math.random() * 2 * Math.PI;
									var velocity = Math.random() < 0.8 ? 25 : 10;
									if (!particles.ion) {
										particles.ion = [];
									}
									particles.ion.push({
										x: x,
										y: y,
										vx: Math.cos(dir) * velocity,
										vy: Math.sin(dir) * velocity,
										alive: 5
									});
								}
							}, 1000);
						})();
				}
			}
		});

		canvas[0].addEventListener("mouseup", function(event) {
			mouse.left = false;
			mouse.right = false;
		});
		canvas[0].addEventListener("mouseout", function(event) {
			mouse.left = false;
			mouse.right = false;
		});
		canvas[0].addEventListener("contextmenu", function(event) {
			event.preventDefault();
			return false;
		});

		window.addEventListener("keydown", function(event) {
			switch (event.code) {
				case "KeyW":
					kb.w = true;
					break;
				case "KeyA":
					kb.a = true;
					break;
				case "KeyS":
					kb.s = true;
					break;
				case "KeyD":
					kb.d = true;
					break;
			}
		});

		window.addEventListener("keyup", function(event) {
			switch (event.code) {
				case "KeyW":
					kb.w = false;
					break;
				case "KeyA":
					kb.a = false;
					break;
				case "KeyS":
					kb.s = false;
					break;
				case "KeyD":
					kb.d = false;
					break;
			}
		});

		setInterval(function() {
			var changes = false;
			if (kb.a) {
				origin.x--;
				changes = true;
			}
			if (kb.d) {
				origin.x++;
				changes = true;
			}
			if (kb.w) {
				origin.y--;
				changes = true;
			}
			if (kb.s) {
				origin.y++;
				changes = true;
			}
			if (changes) {
				mouse.x = s2gx(mouse.px);
				mouse.y = s2gy(mouse.py);
				if (!updateTicker && mouse.tool === "draw" && (mouse.left || mouse.right)) {
					if (mouse.x >= 0 && mouse.x < gridWidth && mouse.y >= 0 && mouse.y < gridHeight) {
						grid[mouse.x][mouse.y].alive = mouse.left ? 100 : 0;
						grid[mouse.x][mouse.y].color = mouse.color;
					}
				} else if (updateTicker && mouse.left) {
					switch (mouse.tool) {
						case "wall":
							if (mouse.x < 0 || mouse.x >= gridWidth || mouse.y < 0 || mouse.y >= gridHeight) {
								break
							}
							var redundant = false;
							for (var i = 0; i < markers.length; i++) {
								if (markers[i].type !== "wall") {
									continue;
								}
								if (markers[i].x === mouse.x && markers[i].y === mouse.y) {
									redundant = true;
									break;
								}
							}
							if (redundant) {
								break;
							}
							if (!ctrl.getResource(1)) {
								break;
							}
							var marker = {
								type: "wall",
								x: mouse.x,
								y: mouse.y,
								alive: true
							};
							markers.push(marker);
							(function() {
								var x = mouse.x;
								var y = mouse.y;
								setTimeout(function() {
									marker.alive = false;
									if (x < 0 || x >= gridWidth || y < 0 || y >= gridHeight) {
										return;
									}
									lifeWorker.postMessage({
										type: "changes",
										changes: [
											{
												x: x,
												y: y,
												alive: 255,
												color: Colors.wall
											}
										]
									});
								}, 1000);
							})();
							break;
						case "ion":
							if (mouse.x < 0 || mouse.x >= gridWidth || mouse.y < 0 || mouse.y >= gridHeight) {
								break
							}
							if (!ctrl.getResource(1)) {
								break;
							}
							var marker = {
								type: "ion",
								x: mouse.x,
								y: mouse.y,
								alive: true
							};
							markers.push(marker);
							(function() {
								var x = mouse.x * cellSize + 0.5 * cellSize;
								var y = mouse.y * cellSize + 0.5 * cellSize;
								setTimeout(function() {
									marker.alive = false;
									for (var i = 0; i < 10; i++) {
										var dir = Math.random() * 2 * Math.PI;
										var velocity = Math.random() < 0.8 ? 25 : 10;
										if (!particles.ion) {
											particles.ion = [];
										}
										particles.ion.push({
											x: x,
											y: y,
											vx: Math.cos(dir) * velocity,
											vy: Math.sin(dir) * velocity,
											alive: 5
										});
									}
								}, 1000);
							})();
							break;
					}	
				}
				ctrl.draw();
			}
		}, 25);

		var ctrl = {
			draw: _.throttle(function() {
				ctx.clearRect(0, 0, width, height);
				var tl = {
					x: s2gx(0),
					y: s2gy(0)
				};
				var br = {
					x: s2gx(width) + 1,
					y: s2gy(height) + 1
				};

				tl.x = tl.x > 0 ? tl.x : 0;
				tl.x = tl.x < gridWidth - 1 ? tl.x : gridWidth - 1;
				tl.y = tl.y > 0 ? tl.y : 0;
				tl.y = tl.y < gridHeight - 1 ? tl.y : gridHeight - 1;

				br.x = br.x < gridWidth - 1 ? br.x : gridWidth - 1;
				br.y = br.y < gridHeight - 1 ? br.y : gridHeight - 1;

				ctx.fillStyle = "#000000";
				if (br.x >= tl.x && br.y >= tl.y) {
					ctx.fillRect((tl.x - origin.x) * cellSize, (tl.y - origin.y) * cellSize, (br.x - tl.x + 1) * cellSize, (br.y - tl.y + 1) * cellSize);
				}

				ctx.strokeStyle = "#DDDDDD";
				ctx.beginPath();
				for (var x = tl.x; x <= br.x; x++) {
					for (var y = tl.y; y <= br.y; y++) {
						if (grid[x][y].alive) {
							switch (grid[x][y].color) {
								case Colors.red:
									ctx.fillStyle = "#" + life2hex(grid[x][y].alive) + "0000";
									break;
								case Colors.green:
									ctx.fillStyle = "#00" + life2hex(grid[x][y].alive) + "00"; 
									break;
								case Colors.blue:
									ctx.fillStyle = "#0000" + life2hex(grid[x][y].alive);
									break;
								case Colors.wall:
								case Colors.extractor:
									var hex = life2hex(grid[x][y].alive);
									ctx.fillStyle = "#" + hex + hex + hex;
									break;
								default:
									ctx.fillStyle = "#000000";
							}
							ctx.fillRect((x - origin.x) * cellSize, (y - origin.y) * cellSize, cellSize, cellSize);
							ctx.rect((x - origin.x) * cellSize, (y - origin.y) * cellSize, cellSize, cellSize);
							if (grid[x][y].color === Colors.extractor) {
								if (grid[x][y].resource) {
									var freq = grid[x][y].resource / 1000;
									var hex1 = life2hex((stats.updateNumber * freq) % 100);
									var hex2 = life2hex(100 - (stats.updateNumber * freq) % 100);
									ctx.fillStyle = "#" + hex1 + hex2 + hex1;
									ctx.fillRect((x - origin.x) * cellSize + 0.25 * cellSize, (y - origin.y) * cellSize + 0.25 * cellSize, 0.5 * cellSize, 0.5 * cellSize);
								} else {
									ctx.fillStyle = "#000000";
									ctx.fillRect((x - origin.x) * cellSize + 0.25 * cellSize, (y - origin.y) * cellSize + 0.25 * cellSize, 0.5 * cellSize, 0.5 * cellSize);
								}
							}
						} else if (grid[x][y].resource) {
							var hex1 = life2hex(stats.updateNumber % 100);
							var hex2 = life2hex(100 - stats.updateNumber % 100);
							ctx.fillStyle = "#" + hex1 + hex2 + hex1;
							ctx.fillRect((x - origin.x) * cellSize, (y - origin.y) * cellSize, cellSize, cellSize);
						} else if (grid[x][y].inhibitor) {
							ctx.fillStyle = "#" + life2hex(grid[x][y].inhibitor) + "0EE3";
							ctx.fillRect((x - origin.x) * cellSize, (y - origin.y) * cellSize, cellSize, cellSize);
						}
					}
				}
				ctx.stroke();

				for (let [key, set] of particleSets) {
					if (!key || key === ParticleTypes.napalm) {
						continue;
					}
					ctx.beginPath();
					for (let particle of set) {
						let x = particle.x - (origin.x * cellSize);
						let y = particle.y - (origin.y * cellSize);
						switch (key) {
							case ParticleTypes.fireWhite:
							case ParticleTypes.fireYellow:
							case ParticleTypes.fireRed:
							case ParticleTypes.inhibitor:
								ctx.moveTo(x, y);
								ctx.arc(
									x,
									y,
									particle.iter,
									0,
									2 * Math.PI
								);
								break;
							case ParticleTypes.thermobaric:
								ctx.moveTo(x, y);
								ctx.arc(
									x,
									y,
									particle.iter * 0.5,
									0,
									2 * Math.PI
								);
								break;
							default:
								ctx.moveTo(x, y);
								ctx.rect(x, y, 2, 2);
						}
					}
					switch (key) {
						case ParticleTypes.fireWhite:
							ctx.fillStyle = "rgba(240, 240, 240, 0.8)";
							break;
						case ParticleTypes.fireYellow:
							ctx.fillStyle = "rgba(243, 239, 19, 0.6)";
							break;
						case ParticleTypes.fireRed:
							ctx.fillStyle = "rgba(230, 20, 2, 0.5)";
							break;
						case ParticleTypes.inhibitor:
							ctx.fillStyle = "rgba(240, 14, 227, 0.3)";
							break;
						case ParticleTypes.ionWhite:
							ctx.fillStyle = "#FFFFFF";
							break;
						case ParticleTypes.ionBlue:
							ctx.fillStyle = "#1240FF";
							break;
						case ParticleTypes.thermobaric:
							ctx.fillStyle = "rgba(240, 230, 230, 0.8)";
							break;
						default:
							ctx.fillStyle = "#FAE219";
					}
					ctx.fill();
				}

				for (let i = 0; i < markers.length; i++) {
					switch (markers[i].type) {
						case "cluster_bomb":
							ctx.beginPath();
							ctx.strokeStyle = "#DAD209";
							ctx.ellipse(
								(markers[i].x - origin.x) * cellSize + 0.5 * cellSize,
								(markers[i].y - origin.y) * cellSize + 0.5 * cellSize,
								(10 * markers[i].iter) / 20,
								(10 * markers[i].iter) / 20,
								0,
								0,
								2 * Math.PI
							);
							ctx.stroke();
							break;
						case "napalm":
							ctx.beginPath();
							ctx.strokeStyle = "#FC6823";
							ctx.ellipse(
								(markers[i].x - origin.x) * cellSize + 0.5 * cellSize,
								(markers[i].y - origin.y) * cellSize + 0.5 * cellSize,
								(10 * markers[i].iter) / 20,
								(10 * markers[i].iter) / 20,
								0,
								0,
								2 * Math.PI
							);
							ctx.stroke();
							break;
						case "thermobaric":
							ctx.beginPath();
							ctx.strokeStyle = "#E6E806";
							ctx.ellipse(
								(markers[i].x - origin.x) * cellSize + 0.5 * cellSize,
								(markers[i].y - origin.y) * cellSize + 0.5 * cellSize,
								(12 * markers[i].iter) / 20,
								(12 * markers[i].iter) / 20,
								0,
								0,
								2 * Math.PI
							);
							ctx.stroke();
							break;
						case "inhibitor":
							ctx.beginPath();
							ctx.strokeStyle = "#27EB6A";
							ctx.ellipse(
								(markers[i].x - origin.x) * cellSize + 0.5 * cellSize,
								(markers[i].y - origin.y) * cellSize + 0.5 * cellSize,
								(10 * markers[i].iter) / 20,
								(10 * markers[i].iter) / 20,
								0,
								0,
								2 * Math.PI
							);
							ctx.stroke();
							break;
						case "wall":
							ctx.beginPath();
							ctx.strokeStyle = "#FFFFFF";
							ctx.ellipse(
								(markers[i].x - origin.x) * cellSize + 0.5 * cellSize,
								(markers[i].y - origin.y) * cellSize + 0.5 * cellSize,
								(5 * markers[i].iter) / 20,
								(5 * markers[i].iter) / 20,
								0,
								0,
								2 * Math.PI
							);
							ctx.stroke();
							break;
						case "ion":
							ctx.beginPath();
							ctx.strokeStyle = "#1155FF";
							ctx.ellipse(
								(markers[i].x - origin.x) * cellSize + 0.5 * cellSize,
								(markers[i].y - origin.y) * cellSize + 0.5 * cellSize,
								(5 * markers[i].iter) / 20,
								(5 * markers[i].iter) / 20,
								0,
								0,
								2 * Math.PI
							);
							ctx.stroke();
							break;
						case "harvest":
							ctx.beginPath();
							ctx.strokeStyle = "#6D63AE";
							ctx.ellipse(
								(markers[i].x - origin.x) * cellSize + 0.5 * cellSize,
								(markers[i].y - origin.y) * cellSize + 0.5 * cellSize,
								(10 * markers[i].iter) / 20,
								(10 * markers[i].iter) / 20,
								0,
								0,
								2 * Math.PI
							);
							ctx.stroke();
							break;
					}
				}

				if (typeof mouse.x === "number" && typeof mouse.y === "number") {
					switch (mouse.color) {
						case Colors.red:
							ctx.strokeStyle = "#FF0000";
							break;
						case Colors.green:
							ctx.strokeStyle = "#00FF00";
							break;
						default:
							ctx.strokeStyle = "#0000FF";
					}
					ctx.beginPath();
					ctx.rect((mouse.x - origin.x) * cellSize, (mouse.y - origin.y) * cellSize, cellSize, cellSize);
					ctx.stroke();
				}

				ctx.fillStyle = "#FFFFFF";
				ctx.fillText(stats.updateGridLast, 10, 10);
			}, 20),

			update: function() {
				/* TODO remove
				var nextParticles = {};
				for (var key in particles) {
					for (var i = 0; i < particles[key].length; i++) {
						var particle = particles[key][i];
						var gx = Math.floor(particle.x / cellSize);
						var gy = Math.floor(particle.y / cellSize);
						if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
							switch (key) {
								case "inhibitor":
									grid[gx][gy].inhibitor += 3;
									break;
								case "ion":
								case "ion-blue":
									grid[gx][gy].alive = grid[gx][gy].color & Colors.lifeMask ? 0 : grid[gx][gy].alive;
									break;
								case "thermobaric":
									// do nothing
									break;
								default:
									grid[gx][gy].alive = 0;
							}
						}
						
						particle.x += particle.vx;
						particle.y += particle.vy;
						particle.vx *= 0.95;
						particle.vy *= 0.95;
						particle.alive--;
						particle.iter = typeof particle.iter === "number" && particle.iter > 0 ? particle.iter + 1 : 1;
						if (particle.alive > 0) {
							switch (key) {
								case "fire-white":
									var nkey = particle.iter > 4 ? "fire-yellow": "fire-white";
									if (!nextParticles[nkey]) {
										nextParticles[nkey] = [];
									}
									nextParticles[nkey].push(particle);
									break;
								case "fire-yellow":
									var nkey = particle.iter > 14 ? "fire-red": "fire-yellow";
									if (!nextParticles[nkey]) {
										nextParticles[nkey] = [];
									}
									nextParticles[nkey].push(particle);
									break;
								case "ion":
									var nkey = particle.iter > 2 ? "ion-blue" : "ion";
									if (!nextParticles[nkey]) {
										nextParticles[nkey] = [];
									}
									nextParticles[nkey].push(particle);
									break;
								case "napalm":
									if (Math.random() < 0.3) {
										var dir = Math.random() * 2 * Math.PI;
										var velocity = Math.random() * 10;
										if (!nextParticles["fire-white"]) {
											nextParticles["fire-white"] = [];
										}
										nextParticles["fire-white"].push({
											x: particle.x,
											y: particle.y,
											vx: particle.vx + Math.cos(dir) * velocity,
											vy: particle.vy + Math.sin(dir) * velocity,
											alive: 30
										});
									}
									// fallthrough
								default:
									if (!nextParticles[key]) {
										nextParticles[key] = [];
									}
									nextParticles[key].push(particle);
							}
						} else {
							switch (key) {
								case "thermobaric":
									for (var j = 0; j < 200; j++) {
										var dir = Math.random() * 2 * Math.PI;
										var velocity = 15 + Math.random() * 25;
										if (!nextParticles["blast"]) {
											nextParticles["blast"] = [];
										}
										nextParticles["blast"].push({
											x: particle.x,
											y: particle.y,
											vx: particle.vx + Math.cos(dir) * velocity,
											vy: particle.vy + Math.sin(dir) * velocity,
											alive: 40
										});
									}
									break;
							}
						}
					}
				}
				particles = nextParticles;
				*/

				/* markers */
				var nextMarkers = [];
				for (var i = 0; i < markers.length; i++) {
					if (markers[i].alive) {
						markers[i].iter = typeof markers[i].iter === "number" && markers[i].iter > 0 ? markers[i].iter - 1 : 20;
						nextMarkers.push(markers[i]);
					}
				}
				markers = nextMarkers;

				this.draw();
				stats.updateNumber++;
			},

			updateGrid: function() {
				throw "deprecated";
				var startTime = new Date().getTime();
				/* first pass */
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						var neighbors = 0;
						var neighborAlives = 0;
						var reds = 0;
						var greens = 0;
						var inhibitorNeighbors = 0;
						var inhibitorSum = 0;
						for (var nx = -1; nx <= 1; nx++) {
							for (var ny = -1; ny <= 1; ny++) {
								if (nx === 0 && ny === 0) {
									continue;
								}
								var gx = x + nx;
								var gy = y + ny;
								if (gx < 0 || gy < 0 || gx >= gridWidth || gy >= gridHeight) {
									continue;
								}

								if (grid[gx][gy].alive && grid[gx][gy].color & Colors.lifeMask) {
									neighbors++;
									neighborAlives += grid[gx][gy].alive;
									switch (grid[gx][gy].color) {
										case Colors.red:
											reds++;
											break;
										case Colors.green:
											greens++;
											break;
									}
								}
								inhibitorNeighbors++;
								inhibitorSum += grid[gx][gy].inhibitor;
							}
						}

						if (inhibitorNeighbors && inhibitorSum) {
							var average = inhibitorSum / inhibitorNeighbors;
							grid[x][y].nextInhibitor = grid[x][y].inhibitor + (average - grid[x][y].inhibitor) * 0.1;
						}

						if (grid[x][y].alive && grid[x][y].color & Colors.structureMask) {
							grid[x][y].nextAlive = grid[x][y].alive - (neighborAlives / 100);
						} else {
							if (grid[x][y].alive && neighbors >= 2 && neighbors <= 3) {	// survival
								grid[x][y].nextAlive = grid[x][y].alive + this.fastRandom() % 5;
							} else if (!grid[x][y].alive && neighbors === 3 && this.fastRandom() < (153 - grid[x][y].inhibitor * 2)) {	// birth
								grid[x][y].nextAlive = this.fastRandom() % 5;
								if (reds > greens) {
									grid[x][y].color = Colors.red;
								} else if (greens > reds) {
									grid[x][y].color = Colors.green;
								} else {
									grid[x][y].color = Colors.blue;
								}
							} else {
								grid[x][y].nextAlive = grid[x][y].alive - this.fastRandom() % 15;
							}
						}
					}
				}

				/* second pass */
				for (x = 0; x < gridWidth; x++) {
					for (y = 0; y < gridHeight; y++) {
						var nextAlive = grid[x][y].nextAlive;
						nextAlive = nextAlive < 0 ? 0 : nextAlive;
						nextAlive = nextAlive > 100 ? 100 : nextAlive;
						grid[x][y].alive = nextAlive;

						var nextInhibitor = grid[x][y].nextInhibitor;
						nextInhibitor = nextInhibitor > 0 ? nextInhibitor : 0;
						grid[x][y].inhibitor = nextInhibitor;

						if (grid[x][y].inhibitor < 1) {
							grid[x][y].inhibitor = 0;
						}
						if (grid[x][y].color === Colors.extractor && grid[x][y].alive && grid[x][y].resource) {
							this.addResource(1);
							grid[x][y].resource--;
							grid[x][y].resource = Math.max(0, grid[x][y].resource);
						}
					}
				}
				stats.updateGridLast = new Date().getTime() - startTime;
			},

			run: function() {
				if (updateTicker) {
					return;
				}
				if (!lifeWorker || !particleWorker) {
					throw "workers not initialized";
				}
				lifeWorker.postMessage({
					type: "run"
				});
				particleWorker.postMessage({
					type: "run"
				});
				var that = this;
				updateTicker = setInterval(function() {
					that.update();
				}, 20);
			},

			stop: function() {
				if (!updateTicker) {
					return;
				}
				if (!lifeWorker || !particleWorker) {
					throw "workers not initialized";
				}
				lifeWorker.postMessage({
					type: "stop"
				});
				particleWorker.postMessage({
					type: "stop"
				});
				clearInterval(updateTicker);
				updateTicker = null;
			},

			setColor: function(color) {
				switch (color) {
				case "blue":
					mouse.color = Colors.blue;
					break;
				case "red":
					mouse.color = Colors.red;
					break;
				case "green":
					mouse.color = Colors.green;
					break;
				}
				this.draw();
			},

			setTool: function(tool) {
				switch (tool) {
					case "draw":
					case "cluster":
					case "wall":
					case "napalm":
					case "harvest":
					case "inhibitor":
					case "ion":
					case "thermobaric":
						mouse.tool = tool;
				}
			},

			getResource: function(amount) {
				var ok = typeof amount === "number" && amount > 0 ? true : false;
				if (!ok) {
					return false;
				}
				if (resources < amount) {
					resourceField.addClass("error");
					return false;
				}
				resources -= amount;
				resourceField.removeClass("error");
				resourceField.html(Math.floor(resources));
				return true;
			},

			addResource: function(amount) {
				var ok = typeof amount === "number" && amount > 0 ? true : false;
				if (!ok) {
					return false;
				}
				resources += amount;
				resourceField.removeClass("error");
				resourceField.html(Math.floor(resources));
				return true;
			},

			generateMap: function() {
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						if (Math.random() < 0.6) {
							grid[x][y].alive = 100;
							grid[x][y].color = Colors.wall;
						}
					}
				}

				for (var n = 0; n < 10; n++) {
					for (var x = 0; x < gridWidth; x++) {
						for (var y = 0; y < gridHeight; y++) {
							var neighbors = 0;
							for (var nx = -1; nx <= 1; nx++) {
								for (var ny = -1; ny <= 1; ny++) {
									if (nx === 0 && ny === 0) {
										continue;
									}
									var gx = x + nx;
									var gy = y + ny;

									if (gx < 0 || gy < 0 || gx >= gridWidth || gy >= gridHeight) {
										neighbors++;	// count edges as neighbors
										continue;
									}
									if (grid[gx][gy].alive) {
										neighbors++;
									}
								}
							}

							if (grid[x][y].alive && neighbors < 2 || neighbors > 3) {	// death
								grid[x][y].nextAlive = 0;
							} else if (!grid[x][y].alive && neighbors === 3) {	// birth
								grid[x][y].nextAlive = 100;
							} else {		// no change
								grid[x][y].nextAlive = grid[x][y].alive;
							}
						}
					}

					for (x = 0; x < gridWidth; x++) {
						for (y = 0; y < gridHeight; y++) {
							grid[x][y].alive = grid[x][y].nextAlive;
							if (grid[x][y].alive) {
								grid[x][y].color = Colors.wall;
							} else {
								grid[x][y].color = Colors.none;
							}
						}
					}
				}

				for (x = 0; x < gridWidth; x++) {
					for (y = 0; y < gridHeight; y++) {
						neighbors = 0;
						for (nx = -1; nx <= 1; nx++) {
							for (ny = -1; ny <= 1; ny++) {
								if (nx === 0 && ny === 0) {
									continue;
								}
								gx = x + nx;
								gy = y + ny;

								if (gx < 0 || gy < 0 || gx >= gridWidth || gy >= gridHeight) {
									neighbors++;	// count edges as neighbors
									continue;
								}
								if (grid[gx][gy].alive) {
									neighbors++;
								}
							}
						}

						if (neighbors === 0 && Math.random() < 0.05) {
							grid[x][y].nextColor = Colors.green;
						} else if (neighbors >= 6 && Math.random() < 0.1) {
							grid[x][y].nextResource = 1000 + 4000 * Math.random();
						}
					}
				}

				for (x = 0; x < gridWidth; x++) {
					for (y = 0; y < gridHeight; y++) {
						if (grid[x][y].nextColor) {
							grid[x][y].alive = 100;
							grid[x][y].color = grid[x][y].nextColor;
							delete(grid[x][y], "nextColor");
						}
						if (grid[x][y].nextResource) {
							grid[x][y].resource = grid[x][y].nextResource;
							delete(grid[x][y].nextResource);
						}
					}
				}
			},

			initWorkers: function() {
				if (lifeWorker) {
					throw "initWorkers called twice";
				}
				if (!window.Worker) {
					throw "web workers not supported";
				}
				particleWorker = new Worker("/assets/js/worker/particle.js");
				lifeWorker = new Worker("/assets/js/worker/life.js");
				lifeWorker.onmessage = function(e) {
					if (typeof e.data !== "object") {
						console.error("received message from lifeWorker of type " + typeof e.data);
						return;
					}
					switch (e.data.type) {
						case "update":
							ctrl.lifeUpdate(e.data.buffers);
							break;
						default:
							console.error("unknown message type from lifeWorker", e.data.type);
					}
				};
				particleWorker.onmessage = function(e) {
					if (typeof e.data !== "object") {
						console.error("received message from particleWorker of type " + typeof e.data);
						return;
					}
					switch (e.data.type) {
						case "update":
							ctrl.particleUpdate(e.data.buffers);
							break;
						default:
							console.error("unknown message type from particleWorker", e.data.type);
					}
				}
				lifeWorker.postMessage({
					type: "load"
				});
			},

			lifeUpdate: function(buffers) {
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						var offset = x * gridWidth + y;
						grid[x][y].alive = buffers.alive[offset];
						grid[x][y].color = buffers.color[offset];
					}
				}
				lifeWorker.postMessage({
					type: "bufreturn",
					buffers: buffers
				}, [buffers.alive.buffer, buffers.color.buffer]);
				this.draw();
			},

			particleUpdate: function(buffers) {
				let numParticles = (buffers.particles.buffer.byteLength / PARTICLE_SIZE)|0;
				let gridChanges = new Map();
				for (let i = 0; i < numParticles; i++) {
					if (i >= particles.length) {
						particles.push({});
					}
					let offset = i * PARTICLE_SIZE;
					let alive = buffers.particles.getUint8(offset + 32);
					let type = buffers.particles.getUint8(offset + 34);
					particles[i].alive = alive;
					particles[i].type = type;
					if (!alive) {
						if (type && particleSets.get(particles[i].type).has(particles[i])) {
							particleSets.get(particles[i].type).delete(particles[i]);
						}
						continue;
					}

					particles[i].x = buffers.particles.getFloat64(offset);
					particles[i].y = buffers.particles.getFloat64(offset + 8);
					particles[i].vx = buffers.particles.getFloat64(offset + 16);
					particles[i].vy = buffers.particles.getFloat64(offset + 24);
					particles[i].iter = buffers.particles.getUint8(offset + 33);
					particleSets.get(particles[i].type).add(particles[i]);

					if (particles[i].type & ParticleTypes.gridActiveMask) {
						let x = (particles[i].x / cellSize)|0;
						let y = (particles[i].y / cellSize)|0;
						if (x >= 0 && x < gridWidth && y >= 0 && y < gridHeight) {
							let key = x + "-" + y;
							switch (particles[i].type) {
								default:
									if (gridChanges.has(key)) {
										let change = gridChanges.get(key);
										change.blast = change.blast ? change.blast + 1 : 1;
										gridChanges.set(key, change);
									} else {
										gridChanges.set(key, {
											x: x,
											y: y,
											blast: 1
										});
									}
							}
						}
					}
				}
				particleWorker.postMessage({
					type: "bufreturn",
					buffers: buffers
				}, [buffers.particles.buffer]);
				if (gridChanges.size) {
					let changes = [];
					for (let change of gridChanges.values()) {
						changes.push(change);
					}
					lifeWorker.postMessage({
						type: "changes",
						changes: changes
					});
				}
				this.draw();
			},

			particleEmpty: function() {
				for (let i = 0; i < particles.length; i++) {
					if (particles[i].length) {
						particles[i] = [];
					}
				}
			}
		};

		//ctrl.generateMap();
		ctrl.initWorkers();

		return ctrl;
	};

	// onload
	$(function() {
		$(".js-widget.life-widget").each(function(i, v) {
			var widget = $(v);
			var ctrl = lifeController(widget);
			widget.data("controller", ctrl);
			ctrl.draw();

			widget.on("click", ".life-widget.run-button", function(event) {
				var btn = $(this);
				if (btn.hasClass("loading")) {
					ctrl.stop();
					btn.removeClass("loading");
				} else {
					ctrl.run();
					btn.addClass("loading");
				}
			});

			widget.on("change", "input[name=color]", function(event) {
				ctrl.setColor($(this).val());
			}).on("change", "input[name=tool]", function(event) {
				ctrl.setTool($(this).val());
			});;

			widget.find("input[name=color][value=blue]").prop("checked", true);
			widget.find("input[name=tool][value=draw]").prop("checked", true);
		});
	});
}());
