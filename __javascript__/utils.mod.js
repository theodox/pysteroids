	__nest__ (
		__all__,
		'utils', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var three = __init__ (__world__.org.threejs);
					var pad_wrap = function (min, max, val) {
						if (val < min) {
							return max;
						}
						if (val > max) {
							return min;
						}
						return val;
					};
					var wrap = function (obj) {
						var XWRAP = 70;
						var XNWRAP = -(70);
						var YWRAP = 35;
						var YNWRAP = -(35);
						var __left0__ = tuple ([obj.position.x, obj.position.y, obj.position.z]);
						var x = __left0__ [0];
						var y = __left0__ [1];
						var z = __left0__ [2];
						var x = pad_wrap (XNWRAP, XWRAP, x);
						var y = pad_wrap (YNWRAP, YWRAP, y);
						obj.position.set (x, y, z);
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
					var FPSCounter = __class__ ('FPSCounter', [object], {
						get __init__ () {return __get__ (this, function (self, hud_element) {
							self.frames = list ([0.1]);
							for (var n = 0; n < 99; n++) {
								self.frames.append (0.1);
							}
							self.next_frame = 0;
							self.average = 0;
							self.visible = true;
							self.element = hud_element;
						});},
						get py_update () {return __get__ (this, function (self, t) {
							self.frames [self.next_frame] = t;
							self.next_frame++;
							if (self.next_frame > 99) {
								self.next_frame = 0;
							}
							var sum = (function __lambda__ (a, b) {
								return a + b;
							});
							var total = 0;
							for (var n = 0; n < 100; n++) {
								total += self.frames [n];
							}
							self.average = total * 10;
							if (self.visible) {
								self.element.innerHTML = '{} fps'.format (int (1000 / self.average));
							}
						});}
					});
					__pragma__ ('<use>' +
						'org.threejs' +
					'</use>')
					__pragma__ ('<all>')
						__all__.AABB = AABB;
						__all__.FPSCounter = FPSCounter;
						__all__.clamp = clamp;
						__all__.now = now;
						__all__.pad_wrap = pad_wrap;
						__all__.set_element = set_element;
						__all__.sign = sign;
						__all__.three = three;
						__all__.wrap = wrap;
					__pragma__ ('</all>')
				}
			}
		}
	);
