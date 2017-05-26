	(function () {
		var random = {};
		var three =  __init__ (__world__.org.threejs);
		__nest__ (random, '', __init__ (__world__.random));
		var wrap = function (obj) {
			var pos = obj.position;
			if (pos.x < -(30)) {
				pos.x = 30;
			}
			else if (pos.x > 30) {
				pos.x = -(30);
			}
			if (pos.y < -(30)) {
				pos.y = 30;
			}
			else if (pos.y > 30) {
				pos.y = -(30);
			}
			obj.matrixWorld.setPosition (pos);
		};
		var clamp = function (val, low, high) {
			return max (min (val, high), low);
		};
		var sign = function (val) {
			if (val > 0) {
				return 1;
			}
			if (val < 0) {
				return -(1);
			}
			return 0;
		};
		var now = function () {
			return new Date;
		};
		var set_element = function (id, value) {
			document.getElementById (id).innerHTML = value;
		};
		var Keyboard = __class__ ('Keyboard', [object], {
			get __init__ () {return __get__ (this, function (self) {
				self.keyboard = dict ({0: false});
				self.handlers = dict ({});
			});},
			get key_down () {return __get__ (this, function (self, key) {
				self.keyboard [key.key] = true;
			});},
			get key_up () {return __get__ (this, function (self, key) {
				self.keyboard [key.key] = false;
			});},
			get py_get () {return __get__ (this, function (self, key) {
				return self.keyboard.py_get (key, false);
			});},
			get get_axis () {return __get__ (this, function (self, key) {
				return self.handlers [key].value;
			});},
			get add_handler () {return __get__ (this, function (self, py_name, handler) {
				self.handlers [py_name] = handler;
			});},
			get py_update () {return __get__ (this, function (self, interval) {
				for (var [_, eachhandler] of self.handlers.py_items ()) {
					eachhandler.py_update (self, interval);
				}
			});},
			get py_clear () {return __get__ (this, function (self, axis) {
				self.handlers.py_get (axis).value = 0;
			});}
		});
		var ControlAxis = __class__ ('ControlAxis', [object], {
			get __init__ () {return __get__ (this, function (self, positive_key, negative_key, attack, decay, deadzone) {
				if (typeof attack == 'undefined' || (attack != null && attack .hasOwnProperty ("__kwargtrans__"))) {;
					var attack = 1;
				};
				if (typeof decay == 'undefined' || (decay != null && decay .hasOwnProperty ("__kwargtrans__"))) {;
					var decay = 0;
				};
				if (typeof deadzone == 'undefined' || (deadzone != null && deadzone .hasOwnProperty ("__kwargtrans__"))) {;
					var deadzone = 0.02;
				};
				if (arguments.length) {
					var __ilastarg0__ = arguments.length - 1;
					if (arguments [__ilastarg0__] && arguments [__ilastarg0__].hasOwnProperty ("__kwargtrans__")) {
						var __allkwargs0__ = arguments [__ilastarg0__--];
						for (var __attrib0__ in __allkwargs0__) {
							switch (__attrib0__) {
								case 'self': var self = __allkwargs0__ [__attrib0__]; break;
								case 'positive_key': var positive_key = __allkwargs0__ [__attrib0__]; break;
								case 'negative_key': var negative_key = __allkwargs0__ [__attrib0__]; break;
								case 'attack': var attack = __allkwargs0__ [__attrib0__]; break;
								case 'decay': var decay = __allkwargs0__ [__attrib0__]; break;
								case 'deadzone': var deadzone = __allkwargs0__ [__attrib0__]; break;
							}
						}
					}
				}
				else {
				}
				self.positive = positive_key;
				self.negative = negative_key;
				self.attack = attack;
				self.decay = decay;
				self.deadzone = deadzone;
				self.value = 0;
			});},
			get py_update () {return __get__ (this, function (self, keyboard, interval) {
				self.value -= (interval * self.decay) * self.value;
				var dz = abs (self.value) < self.deadzone;
				if (keyboard.py_get (self.positive)) {
					var dz = false;
					self.value += interval * self.attack;
				}
				if (keyboard.py_get (self.negative)) {
					var dz = false;
					self.value -= interval * self.attack;
				}
				if (dz) {
					self.value = 0;
				}
				else {
					self.value = clamp (self.value, -(1), 1);
				}
			});}
		});
		var WIDTH = window.innerWidth;
		var HEIGHT = window.innerHeight;
		var camera = null;
		var renderer = null;
		var cube = null;
		var scene = null;
		var last_frame = new Date;
		var kb = Keyboard ();
		kb.add_handler ('spin', ControlAxis ('s', 'a', __kwargtrans__ ({attack: 1, decay: 0.6})));
		kb.add_handler ('thrust', ControlAxis ('w', 'z', __kwargtrans__ ({attack: 0.75, decay: 2, deadzone: 0.1})));
		kb.add_handler ('fire', ControlAxis ('q', 'b', __kwargtrans__ ({attack: 10})));
		var AABB = __class__ ('AABB', [object], {
			get __init__ () {return __get__ (this, function (self, width, height, center) {
				self.hw = width / 2.0;
				self.hh = width / 2.0;
				self.position = center;
			});},
			get contains () {return __get__ (this, function (self, item) {
				var x = self.position.x;
				var y = self.position.y;
				var h = self.hh;
				var w = self.hw;
				return item.x > x - w && item.x < x + w && item.y > y - h && item.y < y + h;
			});},
			get py_update () {return __get__ (this, function (self, pos) {
				self.position = pos;
			});}
		});
		var Bullet = __class__ ('Bullet', [object], {
			EXPIRES: 1,
			RESET_POS: three.Vector3 (0, 0, 1000),
			BULLET_SPEED: 50,
			BULLET_POINTER: 0,
			BULLETS: list ([]),
			get __init__ () {return __get__ (this, function (self) {
				self.vector = three.Vector3 (0, 0, 0);
				self.geo = three.Mesh (three.BoxGeometry (0.25, 0.25, 0.25), three.MeshBasicMaterial (dict ({'color': 16777215})));
				self.lifespan = 0;
				self.momentum = three.Vector3 (0, 0, 0);
				self.reset ();
			});},
			get py_update () {return __get__ (this, function (self, t) {
				if (self.geo.position.z < 1000) {
					self.lifespan += t;
					if (self.lifespan > self.EXPIRES) {
						self.reset ();
						return ;
					}
					var delta = three.Vector3 ().copy (self.vector);
					delta.multiplyScalar (self.BULLET_SPEED * t);
					delta.add (self.momentum);
					var current_pos = self.geo.position.add (delta);
					self.geo.position.set (current_pos.x, current_pos.y, current_pos.z);
					wrap (self.geo);
				}
			});},
			get reset () {return __get__ (this, function (self) {
				self.lifespan = 0;
				self.momentum = three.Vector3 (0, 0, 0);
				self.geo.position.set (self.RESET_POS.x, self.RESET_POS.y, self.RESET_POS.z);
			});}
		});
		var make_bullets = function (scene, amount) {
			for (var n = 0; n < amount; n++) {
				var b = Bullet ();
				scene.add (b.geo);
				Bullet.BULLETS.append (b);
			}
		};
		var fire = function (pos, vector, momentum) {
			for (var eachbullet of Bullet.BULLETS) {
				if (eachbullet.geo.position.z >= 1000) {
					eachbullet.geo.position.set (pos.x, pos.y, pos.z);
					eachbullet.vector = vector;
					eachbullet.lifespan = 0;
					eachbullet.momentum = three.Vector3 ().copy (momentum).multiplyScalar (0.66);
					return ;
				}
			}
			print ('click');
		};
		var Ship = __class__ ('Ship', [object], {
			ROTATE_SPEED: 2.1,
			THRUST: 0.075,
			get __init__ () {return __get__ (this, function (self) {
				self.geo = three.Mesh (three.BoxGeometry (2, 3, 2), three.MeshNormalMaterial ());
				var exhaust = three.Mesh (three.BoxGeometry (1, 2, 1), three.MeshBasicMaterial (dict ({'color': 16776960})));
				self.geo.add (exhaust);
				exhaust.translateY (-(2));
				self.exhaust = exhaust;
				self.momentum = three.Vector3 (0, 0, 0);
			});},
			get add () {return __get__ (this, function (self, scn) {
				scn.add (self.geo);
			});},
			get py_update () {return __get__ (this, function (self, t) {
				var thrust = kb.get_axis ('thrust');
				self.geo.rotateZ (((kb.get_axis ('spin') * self.ROTATE_SPEED) * t) * -(1));
				if (thrust > 0) {
					var thrust_amt = (thrust * self.THRUST) * t;
					self.momentum = self.momentum.add (self.heading.multiplyScalar (thrust_amt));
				}
				var current_pos = self.geo.position;
				self.geo.matrixWorld.setPosition (current_pos.add (self.momentum));
				self.exhaust.visible = thrust > 0;
				if (kb.get_axis ('fire') == 1) {
					fire (self.geo.position, self.heading, self.momentum);
					kb.py_clear ('fire');
				}
			});},
			get get_heading () {return __get__ (this, function (self) {
				return three.Vector3 (self.geo.matrixWorld.elements [4], self.geo.matrixWorld.elements [5], self.geo.matrixWorld.elements [6]);
			});}
		});
		Object.defineProperty (Ship, 'heading', property.call (Ship, Ship.get_heading));;
		var Asteroid = __class__ ('Asteroid', [object], {
			get __init__ () {return __get__ (this, function (self, max_radius) {
				self.radius = ((random.random () + 1) / 2.0) * max_radius;
				self.geo = three.Mesh (three.SphereGeometry (self.radius), three.MeshNormalMaterial ());
				self.geo.position.set (random.random () * 60 - 30, random.random () * 60 - 30, 0);
				self.momentum = three.Vector3 (random.random () - 0.5, random.random () - 0.5, 0);
				self.momentum.multiplyScalar (3);
				self.bbox = AABB (self.radius * 2, self.radius * 2, self.geo.position);
			});},
			get add () {return __get__ (this, function (self, scene) {
				scene.add (self.geo);
			});},
			get py_update () {return __get__ (this, function (self, t) {
				self.geo.translateOnAxis (self.momentum, t);
				self.bbox.py_update (self.geo.position);
			});}
		});
		var asteroids = function () {
			var __accu0__ = [];
			for (var a = 0; a < 6; a++) {
				__accu0__.append (Asteroid (4.5));
			}
			return __accu0__;
		} ();
		var ship = Ship ();
		var init = function () {
			scene = three.Scene ();
			camera = three.PerspectiveCamera (70, WIDTH / HEIGHT, 1, 500);
			camera.position.set (0, 0, 50);
			camera.lookAt (scene.position);
			renderer = three.WebGLRenderer (dict ({'Antialias': true}));
			renderer.setSize (WIDTH, HEIGHT);
			ship.add (scene);
			for (var item of asteroids) {
				item.add (scene);
			}
			make_bullets (scene, 8);
			document.getElementById ('XX').appendChild (renderer.domElement);
			document.onkeydown = kb.key_down;
			document.onkeyup = kb.key_up;
		};
		var render = function () {
			requestAnimationFrame (render);
			var t = (new Date - last_frame) / 1000.0;
			kb.py_update (t);
			var dead = list ([]);
			for (var b of Bullet.BULLETS) {
				if (b.geo.position.z < 1000) {
					for (var a of asteroids) {
						if (a.bbox.contains (b.geo.position)) {
							var d = a.geo.position.distanceTo (b.geo.position);
							if (d < a.radius) {
								b.reset ();
								dead.append (a);
							}
						}
					}
				}
			}
			for (var d of dead) {
				asteroids.remove (d);
				d.geo.visible = false;
				if (d.radius > 1.5) {
					var new_asteroids = random.randint (2, 4);
					for (var n = 0; n < new_asteroids; n++) {
						var new_a = Asteroid (d.radius / new_asteroids);
						new_a.geo.position.set (d.geo.position.x, d.geo.position.y, 0);
						new_a.add (scene);
						asteroids.append (new_a);
					}
				}
			}
			for (var b of Bullet.BULLETS) {
				b.py_update (t);
			}
			ship.py_update (t);
			wrap (ship.geo);
			for (var item of asteroids) {
				item.py_update (t);
				wrap (item.geo);
			}
			renderer.render (scene, camera);
			last_frame = new Date;
		};
		init ();
		render ();
		__pragma__ ('<use>' +
			'org.threejs' +
			'random' +
		'</use>')
		__pragma__ ('<all>')
			__all__.AABB = AABB;
			__all__.Asteroid = Asteroid;
			__all__.Bullet = Bullet;
			__all__.ControlAxis = ControlAxis;
			__all__.HEIGHT = HEIGHT;
			__all__.Keyboard = Keyboard;
			__all__.Ship = Ship;
			__all__.WIDTH = WIDTH;
			__all__.asteroids = asteroids;
			__all__.camera = camera;
			__all__.clamp = clamp;
			__all__.cube = cube;
			__all__.fire = fire;
			__all__.init = init;
			__all__.kb = kb;
			__all__.last_frame = last_frame;
			__all__.make_bullets = make_bullets;
			__all__.now = now;
			__all__.render = render;
			__all__.renderer = renderer;
			__all__.scene = scene;
			__all__.set_element = set_element;
			__all__.ship = ship;
			__all__.sign = sign;
			__all__.wrap = wrap;
		__pragma__ ('</all>')
	}) ();
