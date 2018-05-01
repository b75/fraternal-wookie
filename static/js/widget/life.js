"use strict";

(function() {

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

		var grid = [];
		var particles = {};
		var markers = [];
		var cellSize = 10;
		var gridWidth = 150;
		var gridHeight = 150;
		var updateNumber = 0;
		var resources = 1000;
		var resourceField = $(".js-widget-field.life-widget.resources");

		resourceField.html(Math.floor(resources));

		for (var x = 0; x < gridWidth; x++) {
			grid[x] = [];
			for (var y = 0; y < gridHeight; y++) {
				grid[x][y] = {
					alive: 0,
					inhibitor: 0,
					color: "blue"
				};
				var rand = Math.random() * 100;
				if (rand < 0.05) {
					grid[x][y].alive = 100;
					grid[x][y].color = "wall";
					grid[x][y].special = "resource";
				} else if (rand < 2.0) {
					grid[x][y].alive = 100;
					grid[x][y].color = "green";
				}
			}
		}

		var s2gx = function(x) {
			return Math.floor(x / cellSize) + origin.x;
		};
		var s2gy = function(y) {
			return Math.floor(y  / cellSize) + origin.y;
		};
		var life2hex = function(life) {
			var hex = Math.floor(life * 2.55);
			hex = hex < 0 ? 0 : hex;
			hex = hex > 255 ? 255 : hex;
			hex = hex.toString(16);
			if (hex.length < 2) {
				hex = "0" + hex;
			}
			return hex;
		};

		var running = false;
		var mouse = {
			color: "blue",
			tool: "draw"
		};
		var kb = {};
		var ticker = null;
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

			if (!running && mouse.tool === "draw" && (mouse.left || mouse.right)) {
				if (mouse.x >= 0 && mouse.x < gridWidth && mouse.y >= 0 && mouse.y < gridHeight) {
					grid[mouse.x][mouse.y].alive = mouse.left ? 100 : 0;
					grid[mouse.x][mouse.y].color = mouse.color;
				}
			} else if (running && mouse.left) {
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
								grid[x][y].alive = 100;
								grid[x][y].color = "wall";
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
			if (!running && mouse.tool === "draw" && (mouse.left || mouse.right)) {
				if (mouse.x >= 0 && mouse.x < gridWidth && mouse.y >= 0 && mouse.y < gridHeight) {
					grid[mouse.x][mouse.y].alive = mouse.left ? 100 : 0;
					grid[mouse.x][mouse.y].color = mouse.color;
				}
				ctrl.draw();
			} else if (running && mouse.left) {
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
									for (var j = 0; j < 100; j++) {
										var dir = Math.random() * 2 * Math.PI;
										var velocity = Math.random() < 0.8 ? 25 : 10;
										if (!particles.blast) {
											particles.blast = [];
										}
										particles.blast.push({
											x: ccx,
											y: ccy,
											vx: Math.cos(dir) * velocity,
											vy: Math.sin(dir) * velocity,
											alive: 20
										});
									}
								}, Math.floor(5000 + Math.random() * 500));
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
								grid[x][y].alive = 100;
								grid[x][y].color = "wall";
							}, 1000);
						})();
						break;
					case "harvest":
						if (mouse.x < 0 || mouse.x >= gridWidth || mouse.y < 0 || mouse.y >= gridHeight) {
							break
						}
						if (!grid[mouse.x][mouse.y].alive || grid[mouse.x][mouse.y].color !== "wall" || grid[mouse.x][mouse.y].special !== "resource") {
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
						if (!ctrl.getResource(10)) {
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
								if (grid[x][y].alive && grid[x][y].color === "wall" && grid[x][y].special === "resource") {
									ctrl.addResource(grid[x][y].alive * 5);
									grid[x][y].alive = 0;
									grid[x][y].special = null;
								}
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
				if (!running && mouse.tool === "draw" && (mouse.left || mouse.right)) {
					if (mouse.x >= 0 && mouse.x < gridWidth && mouse.y >= 0 && mouse.y < gridHeight) {
						grid[mouse.x][mouse.y].alive = mouse.left ? 100 : 0;
						grid[mouse.x][mouse.y].color = mouse.color;
					}
				} else if (running && mouse.left) {
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
									grid[x][y].alive = 100;
									grid[x][y].color = "wall";
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
				var startTime = new Date().getTime();
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
								case "red":
									ctx.fillStyle = "#" + life2hex(grid[x][y].alive) + "0000";
									break;
								case "green":
									ctx.fillStyle = "#00" + life2hex(grid[x][y].alive) + "00"; 
									break;
								case "wall":
									switch (grid[x][y].special) {
										case "resource":
											ctx.fillStyle = "#66EFFF";
											break;
										default:
											var hex = life2hex(grid[x][y].alive);
											ctx.fillStyle = "#" + hex + hex + hex;
									}
									break;
								default:
									ctx.fillStyle = "#0000" + life2hex(grid[x][y].alive);
							}
							ctx.fillRect((x - origin.x) * cellSize, (y - origin.y) * cellSize, cellSize, cellSize);
							ctx.rect((x - origin.x) * cellSize, (y - origin.y) * cellSize, cellSize, cellSize);
						} else if (grid[x][y].inhibitor) {
							ctx.fillStyle = "#" + life2hex(grid[x][y].inhibitor) + "0EE3";
							ctx.fillRect((x - origin.x) * cellSize, (y - origin.y) * cellSize, cellSize, cellSize);
						}
					}
				}
				ctx.stroke();

				for (var key in particles) {
					if (key === "napalm") {
						continue;
					}
					ctx.beginPath();
					for (var i = 0; i < particles[key].length; i++) {
						var particle = particles[key][i];
						var x = particle.x - (origin.x * cellSize);
						var y = particle.y - (origin.y * cellSize);
						switch (key) {
							case "fire-white":
							case "fire-yellow":
							case "fire-red":
							case "inhibitor":
								ctx.moveTo(x, y);
								ctx.arc(
									x,
									y,
									particle.iter,
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
						case "fire-white":
							ctx.fillStyle = "rgba(240, 240, 240, 0.8)";
							break;
						case "fire-yellow":
							ctx.fillStyle = "rgba(243, 239, 19, 0.6)";
							break;
						case "fire-red":
							ctx.fillStyle = "rgba(230, 20, 2, 0.5)";
							break;
						case "inhibitor":
							ctx.fillStyle = "rgba(240, 14, 227, 0.3)";
							break;
						default:
							ctx.fillStyle = "#FAE219";
					}
					ctx.fill();
				}

				for (i = 0; i < markers.length; i++) {
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
						case "red":
							ctx.strokeStyle = "#FF0000";
							break;
						case "green":
							ctx.strokeStyle = "#00FF00";
							break;
						default:
							ctx.strokeStyle = "#0000FF";
					}
					ctx.beginPath();
					ctx.rect((mouse.x - origin.x) * cellSize, (mouse.y - origin.y) * cellSize, cellSize, cellSize);
					ctx.stroke();
				}

				var elapsed = String(new Date().getTime() - startTime);
				ctx.fillStyle = "#FFFFFF";
				ctx.fillText(elapsed, 10, 10);
			}, 20),

			update: function() {
				/* grid */
				if (updateNumber % 8 === 0) {
					this.updateGrid();
				}

				/* particles */
				var nextParticles = {};
				for (var key in particles) {
					for (var i = 0; i < particles[key].length; i++) {
						var particle = particles[key][i];
						var gx = Math.floor(particle.x / cellSize);
						var gy = Math.floor(particle.y / cellSize);
						if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
							if (key === "inhibitor") {
								grid[gx][gy].inhibitor += 3;
							} else {
								grid[gx][gy].alive = 0;
							}
						} else {
							particle.alive = 0;
							continue;
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
						}
					}
				}
				particles = nextParticles;

				/* markers */
				var nextMarkers = [];
				for (i = 0; i < markers.length; i++) {
					if (markers[i].alive) {
						markers[i].iter = typeof markers[i].iter === "number" && markers[i].iter > 0 ? markers[i].iter - 1 : 20;
						nextMarkers.push(markers[i]);
					}
				}
				markers = nextMarkers;

				this.draw();
				updateNumber++;
			},

			updateGrid: function() {
				/* first pass */
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						var neighbors = 0;
						var neighborAlives = 0;
						var reds = 0;
						var greens = 0;
						var inhibitorNeighbors = 0;
						var inhibitorSum = 0;

						var neighborHood = [
							{x: x + 1, y: y},
							{x: x + 1, y: y - 1},
							{x: x, y: y - 1},
							{x: x - 1, y: y - 1},
							{x: x - 1, y: y},
							{x: x - 1, y: y + 1},
							{x: x, y: y + 1},
							{x: x + 1, y: y + 1}
						];

						for (var n = 0; n < neighborHood.length; n++) {
							var neighbor = neighborHood[n];
							if (neighbor.x < 0 || neighbor.x >= gridWidth || neighbor.y < 0 || neighbor.y >= gridHeight) {
								continue;
							}
							if (grid[neighbor.x][neighbor.y].alive && grid[neighbor.x][neighbor.y].color !== "wall") {
								neighbors++;
								neighborAlives += grid[neighbor.x][neighbor.y].alive;
								switch (grid[neighbor.x][neighbor.y].color) {
									case "red":
										reds++;
										break;
									case "green":
										greens++;
										break;
								}
							}
							inhibitorNeighbors++;
							inhibitorSum += grid[neighbor.x][neighbor.y].inhibitor;
						}
						if (inhibitorNeighbors && inhibitorSum) {
							var average = inhibitorSum / inhibitorNeighbors;
							grid[x][y].nextInhibitor = grid[x][y].inhibitor + (average - grid[x][y].inhibitor) * 0.1;
						}

						if (grid[x][y].color === "wall" && grid[x][y].alive) {
							grid[x][y].nextAlive = grid[x][y].alive - (neighborAlives / 100);
						} else {
							if (grid[x][y].alive && neighbors >= 2 && neighbors <= 3) {	// survival
								grid[x][y].nextAlive = grid[x][y].alive + Math.random() * 5;
							} else if (!grid[x][y].alive && neighbors === 3 && Math.random() < (0.6 - grid[x][y].inhibitor * 0.01)) {	// birth
								grid[x][y].nextAlive = Math.random() * 5;
								if (reds > greens) {
									grid[x][y].color = "red";
								} else if (greens > reds) {
									grid[x][y].color = "green";
								} else {
									grid[x][y].color = "blue";
								}
							} else {
								grid[x][y].nextAlive = grid[x][y].alive - Math.random() * 15;
							}
						}
					}
				}

				/* second pass */
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						var nextAlive = grid[x][y].nextAlive;
						nextAlive = nextAlive < 0 ? 0 : nextAlive;
						nextAlive = nextAlive > 100 ? 100 : nextAlive;
						grid[x][y].alive = nextAlive;

						var nextInhibitor = grid[x][y].nextInhibitor;
						nextInhibitor = nextInhibitor > 0 ? nextInhibitor : 0;
						grid[x][y].inhibitor = nextInhibitor;

						if (!grid[x][y].alive) {
							grid[x][y].special = null;
						}
						if (grid[x][y].inhibitor < 1) {
							grid[x][y].inhibitor = 0;
						}
					}
				}
			},

			run: function() {
				if (running) {
					return;
				}
				running = true;
				var that = this;

				ticker = setInterval(function() {
					that.update();
				}, 20);
			},

			stop: function() {
				if (!running) {
					return;
				}
				running = false;
				clearInterval(ticker);
			},

			clear: function() {
				if (running) {
					return;
				}
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						grid[x][y].alive = false;
					}
				}
				this.draw();
			},

			setColor: function(color) {
				switch (color) {
				case "blue":
				case "red":
				case "green":
					mouse.color = color;
					this.draw();
				}
			},

			setTool: function(tool) {
				switch (tool) {
					case "draw":
					case "cluster":
					case "wall":
					case "napalm":
					case "harvest":
					case "inhibitor":
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
			}
		};

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
					widget.find(".life-widget.clear-button").removeClass("disabled");
					widget.find(".life-widget.step-button").removeClass("disabled");
				} else {
					ctrl.run();
					btn.addClass("loading");
					widget.find(".life-widget.clear-button").addClass("disabled");
					widget.find(".life-widget.step-button").addClass("disabled");
				}
			});

			widget.on("click", ".life-widget.clear-button", function(event) {
				ctrl.clear();
			}).on("click", ".life-widget.step-button", function(event) {
				ctrl.update();
			}).on("change", "input[name=color]", function(event) {
				ctrl.setColor($(this).val());
			}).on("change", "input[name=tool]", function(event) {
				ctrl.setTool($(this).val());
			});;

			widget.find("input[name=color][value=blue]").prop("checked", true);
			widget.find("input[name=tool][value=draw]").prop("checked", true);
		});
	});
}());
