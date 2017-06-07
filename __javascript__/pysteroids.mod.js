	(function () {
		var random = {};
		__nest__ (random, '', __init__ (__world__.random));
		var three =  __init__ (__world__.org.threejs);
		var Keyboard = __init__ (__world__.controls).Keyboard;
		var ControlAxis = __init__ (__world__.controls).ControlAxis;
		var Ship = __init__ (__world__.units).Ship;
		var Asteroid = __init__ (__world__.units).Asteroid;
		var Bullet = __init__ (__world__.units).Bullet;
		var wrap = __init__ (__world__.utils).wrap;
		var now = __init__ (__world__.utils).now;
		var pad_wrap = __init__ (__world__.utils).pad_wrap;
		var Graphics = __class__ ('Graphics', [object], {
			get __init__ () {return __get__ (this, function (self, w, h, canvas) {
				self.width = w;
				self.height = h;
				self.scene = three.Scene ();
				self.camera = three.PerspectiveCamera (70, self.width / self.height, 1, 500);
				self.camera.position.set (0, 0, 50);
				self.camera.lookAt (self.scene.position);
				self.renderer = three.WebGLRenderer (dict ({'Antialias': true}));
				self.renderer.setSize (self.width, self.height);
				canvas.appendChild (self.renderer.domElement);
			});},
			get render () {return __get__ (this, function (self) {
				self.renderer.render (self.scene, self.camera);
			});},
			get add () {return __get__ (this, function (self, item) {
				self.scene.add (item.geo);
			});}
		});
		var Game = __class__ ('Game', [object], {
			get __init__ () {return __get__ (this, function (self, canvas) {
				self.keyboard = Keyboard ();
				self.graphics = Graphics (window.innerWidth, window.innerHeight, canvas);
				self.create_controls ();
				self.ship = null;
				self.bullets = list ([]);
				self.asteroids = list ([]);
				self.setup ();
				self.last_frame = now ();
			});},
			get create_controls () {return __get__ (this, function (self) {
				self.keyboard.add_handler ('spin', ControlAxis ('ArrowRight', 'ArrowLeft', __kwargtrans__ ({attack: 1, decay: 0.6})));
				self.keyboard.add_handler ('thrust', ControlAxis ('ArrowUp', 'ArrowDown', __kwargtrans__ ({attack: 0.75, decay: 2, deadzone: 0.1})));
				self.keyboard.add_handler ('fire', ControlAxis (' ', 'None', __kwargtrans__ ({attack: 10})));
				document.onkeydown = self.keyboard.key_down;
				document.onkeyup = self.keyboard.key_up;
			});},
			get setup () {return __get__ (this, function (self) {
				self.ship = Ship (self.keyboard, self);
				self.graphics.add (self.ship);
				var rsign = function () {
					if (random.random () < 0.5) {
						return -(1);
					}
					return 1;
				};
				for (var a = 0; a < 10; a++) {
					var x = random.random () - 0.5;
					var y = random.random () - 0.5;
					var z = 0;
					var offset = three.Vector3 (x, y, z);
					offset.normalize ();
					var push = random.randint (12, 27);
					var offset = offset.multiplyScalar (push);
					var r = (random.random () + 1.0) * 2.5;
					var asteroid = Asteroid (r, offset);
					var mx = ((random.random () + random.random ()) + random.random (2)) - 2.0;
					var my = ((random.random () + random.random ()) + random.random (2)) - 2.0;
					asteroid.momentum = three.Vector3 (mx, my, 0);
					self.graphics.add (asteroid);
					self.asteroids.append (asteroid);
				}
				for (var b = 0; b < 8; b++) {
					var bullet = Bullet ();
					self.graphics.add (bullet);
					self.bullets.append (bullet);
				}
			});},
			get tick () {return __get__ (this, function (self) {
				if (len (self.asteroids) == 0) {
					print ('GAME OVER');
					document.getElementById ('ZZ').innerHTML = '<h1>GAME OVER</h1>';
					return ;
				}
				requestAnimationFrame (self.tick);
				var t = (now () - self.last_frame) / 1000.0;
				self.keyboard.py_update (t);
				if (self.keyboard.get_axis ('fire') >= 1) {
					var mo = three.Vector3 ().copy (self.ship.momentum).multiplyScalar (t);
					self.fire (self.ship.position, self.ship.heading, mo);
					self.keyboard.py_clear ('fire');
				}
				var spin = self.keyboard.get_axis ('spin');
				self.ship.spin (spin * t);
				var thrust = self.keyboard.get_axis ('thrust');
				self.ship.thrust (thrust * t);
				if (self.keyboard.get_axis ('fire') >= 1) {
					var mo = three.Vector3 ().copy (self.ship.momentum).multiplyScalar (t);
					self.fire (self.geo.position, self.heading, mo);
					self.keyboard.py_clear ('fire');
				}
				var dead = list ([]);
				for (var b of self.bullets) {
					if (b.position.z < 1000) {
						for (var a of self.asteroids) {
							if (a.bbox.contains (b.position)) {
								var d = a.geo.position.distanceTo (b.position);
								if (d < a.radius) {
									b.reset ();
									dead.append (a);
								}
							}
						}
					}
				}
				for (var d of dead) {
					self.asteroids.remove (d);
					d.geo.visible = false;
					if (d.radius > 1.5) {
						var new_asteroids = random.randint (2, 5);
						for (var n = 0; n < new_asteroids; n++) {
							var new_a = Asteroid ((d.radius + 1.0) / new_asteroids, d.position);
							var mx = (random.random () + random.random (3)) - 2.0;
							var my = (random.random () + random.random (3)) - 2.0;
							new_a.momentum = three.Vector3 ().copy (d.momentum);
							new_a.momentum.add (three.Vector3 (mx, my, 0));
							self.graphics.add (new_a);
							self.asteroids.append (new_a);
						}
					}
				}
				for (var b of self.bullets) {
					b.py_update (t);
				}
				self.ship.py_update (t);
				wrap (self.ship.geo);
				for (var item of self.asteroids) {
					item.py_update (t);
					wrap (item.geo);
				}
				self.graphics.render ();
				self.last_frame = now ();
			});},
			get fire () {return __get__ (this, function (self, pos, vector, momentum, t) {
				for (var each_bullet of self.bullets) {
					if (each_bullet.geo.position.z >= 1000) {
						each_bullet.geo.position.set (pos.x, pos.y, pos.z);
						each_bullet.vector = vector;
						each_bullet.lifespan = 0;
						each_bullet.momentum = three.Vector3 ().copy (momentum).multiplyScalar (0.66);
						return ;
					}
				}
			});}
		});
		var EventQueue = __class__ ('EventQueue', [object], {
			get __init__ () {return __get__ (this, function (self) {
				self.events = dict ({});
			});},
			get add_event () {return __get__ (this, function (self, py_name, event) {
				self.events [py_name] = event;
			});},
			get remove_event () {return __get__ (this, function (self, py_name) {
				self.events.py_pop (py_name, null);
			});}
		});
		var Event = __class__ ('Event', [object], {
			get __init__ () {return __get__ (this, function (self, py_name) {
				self.py_name = py_name;
				self.handlers = dict ({});
			});},
			get subscribe () {return __get__ (this, function (self, py_name, handler) {
				self.handlers [py_name] = handler;
			});},
			get unsubscribe () {return __get__ (this, function (self, py_name) {
				self.handlers.py_pop (py_name, null);
			});},
			get fire () {return __get__ (this, function (self) {
				var args = tuple ([].slice.apply (arguments).slice (1));
				for (var [k, v] of self.handlers.py_items ()) {
					v (...args);
				}
			});}
		});
		var canvas = document.getElementById ('game_canvas');
		var game = Game (canvas);
		game.tick ();
		__pragma__ ('<use>' +
			'controls' +
			'org.threejs' +
			'random' +
			'units' +
			'utils' +
		'</use>')
		__pragma__ ('<all>')
			__all__.Asteroid = Asteroid;
			__all__.Bullet = Bullet;
			__all__.ControlAxis = ControlAxis;
			__all__.Event = Event;
			__all__.EventQueue = EventQueue;
			__all__.Game = Game;
			__all__.Graphics = Graphics;
			__all__.Keyboard = Keyboard;
			__all__.Ship = Ship;
			__all__.canvas = canvas;
			__all__.game = game;
			__all__.now = now;
			__all__.pad_wrap = pad_wrap;
			__all__.wrap = wrap;
		__pragma__ ('</all>')
	}) ();
