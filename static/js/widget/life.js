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
		var particles = [];
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
					color: "blue"
				};
				var rand = Math.random() * 100;
				if (rand < 0.5) {
					grid[x][y].alive = 100;
					grid[x][y].color = "wall";
					grid[x][y].special = "resource";
				} else if (rand < 1.5) {
					grid[x][y].alive = 100;
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
					case "bomb":
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
										particles.push({
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
					case "wall":
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
									ctrl.addResource(grid[x][y].alive);
									grid[x][y].alive = 0;
									grid[x][y].special = null;
								}
							}, 10000);
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
						}
					}
				}
				ctx.stroke();

				ctx.fillStyle = "#FAE219";
				for (var i = 0; i < particles.length; i++) {
					ctx.fillRect(particles[i].x - (origin.x * cellSize), particles[i].y - (origin.y * cellSize), 2, 2);
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
			}, 20),

			update: function() {
				/* grid */
				if (updateNumber % 8 === 0) {
					this.updateGrid();
				}

				/* particles */
				var nextParticles = [];
				for (var i = 0; i < particles.length; i++) {
					var gx = Math.floor(particles[i].x / cellSize);
					var gy = Math.floor(particles[i].y / cellSize);
					if (gx >= 0 && gx < gridWidth && gy >= 0 && gy < gridHeight) {
						grid[gx][gy].alive = 0;
					} else {
						particles[i].alive = 0;
						continue;
					}
					
					particles[i].x += particles[i].vx;
					particles[i].y += particles[i].vy;
					particles[i].vx *= 0.95;
					particles[i].vy *= 0.95;
					particles[i].alive--;
					if (particles[i].alive > 0) {
						nextParticles.push(particles[i]);
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
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						var neighbors = 0;
						var neighborAlives = 0;
						var reds = 0;
						var greens = 0;
						if (x < gridWidth - 1 && grid[x + 1][y].alive && grid[x + 1][y].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x + 1][y].alive;
							switch (grid[x + 1][y].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}
						if (x < gridWidth - 1 && y > 0 && grid[x + 1][y - 1].alive && grid[x + 1][y - 1].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x + 1][y - 1].alive;
							switch (grid[x + 1][y - 1].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}
						if (y > 0 && grid[x][y - 1].alive && grid[x][y - 1].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x][y - 1].alive;
							switch (grid[x][y - 1].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}
						if (x > 0 && y > 0 && grid[x - 1][y - 1].alive && grid[x - 1][y - 1].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x - 1][y - 1].alive;
							switch (grid[x - 1][y - 1].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}
						if (x > 0 && grid[x - 1][y].alive && grid[x - 1][y].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x - 1][y].alive;
							switch (grid[x - 1][y].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}
						if (x > 0 && y < gridHeight - 1 && grid[x - 1][y + 1].alive && grid[x - 1][y + 1].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x - 1][y + 1].alive;
							switch (grid[x - 1][y + 1].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}
						if (y < gridHeight - 1 && grid[x][y + 1].alive && grid[x][y + 1].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x][y + 1].alive;
							switch (grid[x][y + 1].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}
						if (x < gridWidth - 1 && y < gridHeight - 1 && grid[x + 1][y + 1].alive && grid[x + 1][y + 1].color !== "wall") {
							neighbors++;
							neighborAlives += grid[x + 1][y + 1].alive;
							switch (grid[x + 1][y + 1].color) {
								case "red":
									reds++;
									break;
								case "green":
									greens++;
									break;
							}
						}

						if (grid[x][y].color === "wall" && grid[x][y].alive) {
							grid[x][y].nextAlive = grid[x][y].alive - (neighborAlives / 100);
						} else {
							if (grid[x][y].alive && neighbors >= 2 && neighbors <= 3) {	// survival
								grid[x][y].nextAlive = grid[x][y].alive + Math.random() * 5;
							} else if (!grid[x][y].alive && neighbors === 3) {	// birth
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
				for (var x = 0; x < gridWidth; x++) {
					for (var y = 0; y < gridHeight; y++) {
						var next = grid[x][y].nextAlive;
						next = next < 0 ? 0 : next;
						next = next > 100 ? 100 : next;
						grid[x][y].alive = next;
						if (!grid[x][y].alive) {
							grid[x][y].special = null;
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
					case "bomb":
					case "wall":
					case "harvest":
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
