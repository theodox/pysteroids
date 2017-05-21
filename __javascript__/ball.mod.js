	(function () {
		var random = {};
		var three =  __init__ (__world__.org.threejs);
		__nest__ (random, '', __init__ (__world__.random));
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
			});}
		});
		var ControlAxis = __class__ ('ControlAxis', [object], {
			get __init__ () {return __get__ (this, function (self, positive_key, negative_key, attack, decay) {
				if (typeof attack == 'undefined' || (attack != null && attack .hasOwnProperty ("__kwargtrans__"))) {;
					var attack = 1;
				};
				if (typeof decay == 'undefined' || (decay != null && decay .hasOwnProperty ("__kwargtrans__"))) {;
					var decay = 0;
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
				self.value = 0;
			});},
			get py_update () {return __get__ (this, function (self, keyboard, interval) {
				self.value -= (interval * self.decay) * self.value;
				if (keyboard.py_get (self.positive)) {
					self.value += interval * self.attack;
				}
				if (keyboard.py_get (self.negative)) {
					self.value -= interval * self.attack;
				}
				self.value = clamp (self.value, -(1), 1);
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
		kb.add_handler ('spin', ControlAxis ('s', 'a', __kwargtrans__ ({attack: 1, decay: 0.49})));
		var RX = 0;
		var Asteroid = __class__ ('Asteroid', [object], {
			get __init__ () {return __get__ (this, function (self) {
				self.geo = three.Mesh (three.SphereGeometry (random.randint (1, 3)), three.MeshNormalMaterial ());
				self.geo.position.set (random.random () * 10, random.random () * 10, 0);
				self.momentum = three.Vector3 (random.random () - 0.5, random.random () - 0.5, random.random () - 0.5);
				self.momentum.multiplyScalar (3);
			});},
			get add () {return __get__ (this, function (self, scene) {
				scene.add (self.geo);
			});},
			get py_update () {return __get__ (this, function (self, t) {
				self.geo.translateOnAxis (self.momentum, t);
			});}
		});
		var asteroids = function () {
			var __accu0__ = [];
			for (var a = 0; a < 6; a++) {
				__accu0__.append (Asteroid ());
			}
			return __accu0__;
		} ();
		var init = function () {
			scene = three.Scene ();
			camera = three.PerspectiveCamera (70, WIDTH / HEIGHT, 1, 500);
			camera.position.set (0, 0, 50);
			camera.lookAt (scene.position);
			renderer = three.WebGLRenderer (dict ({'Antialias': true}));
			renderer.setSize (WIDTH, HEIGHT);
			cube = three.Mesh (three.BoxGeometry (2, 2, 2), three.MeshNormalMaterial ());
			scene.add (cube);
			for (var item of asteroids) {
				item.add (scene);
			}
			document.getElementById ('XX').appendChild (renderer.domElement);
			document.onkeydown = kb.key_down;
			document.onkeyup = kb.key_up;
		};
		var render = function () {
			requestAnimationFrame (render);
			var t = (new Date - last_frame) / 1000.0;
			kb.py_update (t);
			var SPEED = 4;
			cube.position.y = kb.get_axis ('spin') * 45;
			cube.rotation.y -= (SPEED * t) * 0.3;
			for (var item of asteroids) {
				item.py_update (t);
			}
			renderer.render (scene, camera);
			set_element ('ZZ', t * 1000);
			last_frame = new Date;
		};
		init ();
		render ();
		__pragma__ ('<use>' +
			'org.threejs' +
			'random' +
		'</use>')
		__pragma__ ('<all>')
			__all__.Asteroid = Asteroid;
			__all__.ControlAxis = ControlAxis;
			__all__.HEIGHT = HEIGHT;
			__all__.Keyboard = Keyboard;
			__all__.RX = RX;
			__all__.WIDTH = WIDTH;
			__all__.asteroids = asteroids;
			__all__.camera = camera;
			__all__.clamp = clamp;
			__all__.cube = cube;
			__all__.init = init;
			__all__.kb = kb;
			__all__.last_frame = last_frame;
			__all__.now = now;
			__all__.render = render;
			__all__.renderer = renderer;
			__all__.scene = scene;
			__all__.set_element = set_element;
			__all__.sign = sign;
		__pragma__ ('</all>')
	}) ();
