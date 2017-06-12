	(function () {
		var audio = {};
		var logging = {};
		var random = {};
		__nest__ (logging, '', __init__ (__world__.logging));
		__nest__ (random, '', __init__ (__world__.random));
		var three =  __init__ (__world__.org.threejs);
		var Keyboard = __init__ (__world__.controls).Keyboard;
		var ControlAxis = __init__ (__world__.controls).ControlAxis;
		var Ship = __init__ (__world__.units).Ship;
		var Asteroid = __init__ (__world__.units).Asteroid;
		var Bullet = __init__ (__world__.units).Bullet;
		var wrap = __init__ (__world__.utils).wrap;
		var now = __init__ (__world__.utils).now;
		var FPSCounter = __init__ (__world__.utils).FPSCounter;
		var timer = __init__ (__world__.utils).timer;
		var coroutine = __init__ (__world__.utils).coroutine;
		var clamp = __init__ (__world__.utils).clamp;
		__nest__ (audio, '', __init__ (__world__.audio));
		var DEBUG = true;
		var logger = logging.getLogger ('root');
		logger.addHandler (logging.StreamHandler ());
		if (DEBUG) {
			logger.setLevel (logging.INFO);
			logger.info ('====== debug logging on =====');
		}
		var waiter = function () {
			var args = tuple ([].slice.apply (arguments).slice (0));
			return tuple ([true, args [0]]);
		};
		var done = function () {
			var args = tuple ([].slice.apply (arguments).slice (0));
			print ('done at', args [0]);
		};
		var Graphics = __class__ ('Graphics', [object], {
			get __init__ () {return __get__ (this, function (self, w, h, canvas) {
				self.width = float (w);
				self.height = float (h);
				self.scene = three.Scene ();
				self.camera = three.PerspectiveCamera (53.13, self.width / self.height, 1, 500);
				self.camera.position.set (0, 0, 80);
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
		var Audio = __class__ ('Audio', [object], {
			get __init__ () {return __get__ (this, function (self) {
				self.fire_rota = list ([audio.clip ('344276__nsstudios__laser3.wav'), audio.clip ('344276__nsstudios__laser3.wav'), audio.clip ('344276__nsstudios__laser3.wav'), audio.clip ('344276__nsstudios__laser3.wav')]);
				self.explosion_rota = list ([audio.clip ('108641__juskiddink__nearby-explosion-with-debris.wav'), audio.clip ('108641__juskiddink__nearby-explosion-with-debris.wav'), audio.clip ('108641__juskiddink__nearby-explosion-with-debris.wav'), audio.clip ('108641__juskiddink__nearby-explosion-with-debris.wav')]);
				self.thrust = audio.loop ('146770__qubodup__rocket-boost-engine-loop.wav');
				self.fail = audio.clip ('172950__notr__saddertrombones.mp3');
				self.thrust.play ();
				self.shoot_ctr = 0;
				self.explode_ctr = 0;
			});},
			get fire () {return __get__ (this, function (self) {
				self.fire_rota [__mod__ (self.shoot_ctr, 4)].play ();
				self.shoot_ctr++;
			});},
			get explode () {return __get__ (this, function (self) {
				self.explosion_rota [__mod__ (self.shoot_ctr, 4)].play ();
				self.shoot_ctr++;
			});}
		});
		var Game = __class__ ('Game', [object], {
			get __init__ () {return __get__ (this, function (self, canvas) {
				self.keyboard = Keyboard ();
				self.graphics = Graphics (window.innerWidth - 32, window.innerHeight - 32, canvas);
				self.create_controls ();
				self.ship = null;
				self.bullets = list ([]);
				self.asteroids = list ([]);
				self.setup ();
				self.last_frame = now ();
				self.audio = Audio ();
				self.lives = 3;
				self.resetter = null;
				logging.warning (document.getElementById ('FPS'));
				self.fps_counter = FPSCounter (document.getElementById ('FPS'));
				var v_center = (window.innerHeight - 120) / 2.0;
				var title = document.getElementById ('game_over');
				title.style.top = v_center;
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
				for (var a = 0; a < 8; a++) {
					var x = (random.random () - 0.5) * 2;
					var y = random.random () - 0.5;
					var z = 0;
					var offset = three.Vector3 (x, y, z);
					offset.normalize ();
					var push = random.randint (20, 60);
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
				if (len (self.asteroids) == 0 || self.lives < 1) {
					document.getElementById ('game_over').style.zIndex = 10;
					return ;
				}
				requestAnimationFrame (self.tick);
				var t = now () - self.last_frame;
				self.fps_counter.py_update (t);
				self.keyboard.py_update (t);
				self.handle_input (t);
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
				if (self.ship.visible) {
					for (var a of self.asteroids) {
						if (a.bbox.contains (self.ship.position)) {
							var d = a.geo.position.distanceTo (self.ship.position);
							if (d < a.radius + 0.5) {
								self.resetter = self.kill ();
								dead.append (a);
							}
						}
					}
				}
				else {
					self.resetter.advance (t);
				}
				for (var d of dead) {
					self.asteroids.remove (d);
					d.geo.visible = false;
					if (d.radius > 1.5) {
						self.audio.explode ();
						var new_asteroids = random.randint (2, 5);
						for (var n = 0; n < new_asteroids; n++) {
							var new_a = Asteroid ((d.radius + 1.0) / new_asteroids, d.position);
							var mx = (random.random () - 0.5) * 6;
							var my = (random.random () - 0.5) * 4;
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
				if (self.resetter !== null) {
					self.resetter.advance (t);
				}
				self.graphics.render ();
				self.last_frame = now ();
			});},
			get handle_input () {return __get__ (this, function (self, t) {
				if (self.keyboard.get_axis ('fire') >= 1) {
					var mo = three.Vector3 ().copy (self.ship.momentum).multiplyScalar (t);
					if (self.fire (self.ship.position, self.ship.heading, mo)) {
						self.audio.fire ();
					}
					self.keyboard.py_clear ('fire');
				}
				var spin = self.keyboard.get_axis ('spin');
				self.ship.spin (spin * t);
				var thrust = self.keyboard.get_axis ('thrust');
				self.audio.thrust.volume = clamp (thrust * 5, 0, 1);
				self.ship.thrust (thrust * t);
			});},
			get fire () {return __get__ (this, function (self, pos, vector, momentum, t) {
				for (var each_bullet of self.bullets) {
					if (each_bullet.geo.position.z >= 1000) {
						each_bullet.geo.position.set (pos.x, pos.y, pos.z);
						each_bullet.vector = vector;
						each_bullet.lifespan = 0;
						each_bullet.momentum = three.Vector3 ().copy (momentum).multiplyScalar (0.66);
						return true;
					}
				}
				return false;
			});},
			get kill () {return __get__ (this, function (self) {
				self.lives--;
				self.ship.momentum = three.Vector3 (0, 0, 0);
				self.ship.position = three.Vector3 (0, 0, 0);
				self.ship.geo.setRotationFromEuler (three.Euler (0, 0, 0));
				self.keyboard.py_clear ('spin');
				self.keyboard.py_clear ('thrust');
				self.keyboard.py_clear ('fire');
				self.ship.visible = false;
				self.audio.explode ();
				var can_reappear = now () + 3.0;
				var reappear = function (t) {
					if (now () < can_reappear) {
						return tuple ([true, 'waiting']);
					}
					for (var a of self.asteroids) {
						if (a.bbox.contains (self.ship.position)) {
							return tuple ([true, "can't spawn"]);
						}
					}
					return tuple ([false, 'OK']);
				};
				var clear_resetter = function () {
					self.ship.visible = true;
					self.resetter = null;
				};
				var reset = coroutine (reappear, clear_resetter);
				py_next (reset);
				return reset;
			});}
		});
		var canvas = document.getElementById ('game_canvas');
		var game = Game (canvas);
		game.tick ();
		__pragma__ ('<use>' +
			'audio' +
			'controls' +
			'logging' +
			'org.threejs' +
			'random' +
			'units' +
			'utils' +
		'</use>')
		__pragma__ ('<all>')
			__all__.Asteroid = Asteroid;
			__all__.Audio = Audio;
			__all__.Bullet = Bullet;
			__all__.ControlAxis = ControlAxis;
			__all__.DEBUG = DEBUG;
			__all__.FPSCounter = FPSCounter;
			__all__.Game = Game;
			__all__.Graphics = Graphics;
			__all__.Keyboard = Keyboard;
			__all__.Ship = Ship;
			__all__.canvas = canvas;
			__all__.clamp = clamp;
			__all__.coroutine = coroutine;
			__all__.done = done;
			__all__.game = game;
			__all__.logger = logger;
			__all__.now = now;
			__all__.timer = timer;
			__all__.waiter = waiter;
			__all__.wrap = wrap;
		__pragma__ ('</all>')
	}) ();
