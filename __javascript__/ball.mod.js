	(function () {
		var math = {};
		var three =  __init__ (__world__.org.threejs);
		__nest__ (math, '', __init__ (__world__.math));
		print ('hi');
		var now = function () {
			return new Date;
		};
		var set_element = function (id, value) {
			document.getElementById (id).innerHTML = value;
		};
		var WIDTH = window.innerWidth;
		var HEIGHT = window.innerHeight;
		var camera = null;
		var renderer = null;
		var cube = null;
		var scene = null;
		var last_frame = new Date;
		var init = function () {
			scene = three.Scene ();
			camera = three.PerspectiveCamera (70, WIDTH / HEIGHT, 1, 10);
			camera.position.set (0, 3.5, 5);
			camera.lookAt (scene.position);
			renderer = three.WebGLRenderer (dict ({'Antialias': true}));
			renderer.setSize (WIDTH, HEIGHT);
			cube = three.Mesh (three.BoxGeometry (2, 2, 2), three.MeshNormalMaterial ());
			scene.add (cube);
			var points = function () {
				var __accu0__ = [];
				for (var i = 0; i < 10; i++) {
					__accu0__.append (three.Vector2 (math.sin (i * 0.2) * 10 + 5, (i - 5) * 2));
				}
				return __accu0__;
			} ();
			var lg = three.LatheGeometry (points);
			var lathe = three.Mesh (lg, three.MeshNormalMaterial (dict ({'color': 16776960})));
			scene.add (lathe);
			print (lg);
			document.getElementById ('XX').appendChild (renderer.domElement);
		};
		var render = function () {
			requestAnimationFrame (render);
			var t = (new Date - last_frame) / 1000.0;
			var SPEED = 4;
			cube.rotation.x -= SPEED * t;
			cube.rotation.y -= (SPEED * t) * 0.3;
			renderer.render (scene, camera);
			set_element ('ZZ', t * 1000);
			last_frame = new Date;
		};
		var Game = __class__ ('Game', [object], {
			window: window,
			get __init__ () {return __get__ (this, function (self) {
				self.canvas = null;
				self.context = null;
				self.fps = 30;
				self.start_time = now ();
				self.last_frame = now ();
				self.width = 0;
				self.height = 0;
				self.x = 17;
				self.y = 91;
				self.dx = 100;
				self.dy = 100;
				self.hud = null;
			}, '__init__');},
			get py_update () {return __get__ (this, function (self) {
				var current = now ();
				var elapsed = current - self.last_frame;
				var cx = self.context;
				cx.clearRect (0, 0, self.width, self.height);
				cx.beginPath ();
				cx.arc (self.x, self.y, 10, 0, Math.PI * 360);
				cx.fill ();
				var tmp = elapsed / 1000.0;
				if (self.x > self.width) {
					self.dx = -(98);
				}
				if (self.x < 1) {
					self.dx = 102;
				}
				if (self.y > self.height) {
					self.dy = -(97);
				}
				if (self.y < 1) {
					self.dy = 103;
				}
				self.x = self.x + self.dx * tmp;
				self.y = self.y + self.dy * tmp;
				self.last_frame = current;
				set_element ('FPS', tmp);
				set_element ('X', int (self.x));
				set_element ('Y', int (self.y));
				window.requestAnimationFrame (self.py_update);
			}, 'update');},
			get start () {return __get__ (this, function (self) {
				self.canvas = document.getElementById ('canvas');
				self.context = self.canvas.getContext ('2d');
				self.width = self.canvas.width;
				self.height = self.canvas.height;
				document.getElementById ('FPS').innerHTML = 'zzz';
				self.py_update ();
			}, 'start');}
		});
		init ();
		render ();
		__pragma__ ('<use>' +
			'math' +
			'org.threejs' +
		'</use>')
		__pragma__ ('<all>')
			__all__.Game = Game;
			__all__.HEIGHT = HEIGHT;
			__all__.WIDTH = WIDTH;
			__all__.camera = camera;
			__all__.cube = cube;
			__all__.init = init;
			__all__.last_frame = last_frame;
			__all__.now = now;
			__all__.render = render;
			__all__.renderer = renderer;
			__all__.scene = scene;
			__all__.set_element = set_element;
		__pragma__ ('</all>')
	}) ();
