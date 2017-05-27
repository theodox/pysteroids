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
						var WRAP = 30;
						var NWRAP = -(30);
						var __left0__ = tuple ([obj.position.x, obj.position.y, obj.position.z]);
						var x = __left0__ [0];
						var y = __left0__ [1];
						var z = __left0__ [2];
						var x = pad_wrap (NWRAP, WRAP, x);
						var y = pad_wrap (NWRAP, WRAP, y);
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
					__pragma__ ('<use>' +
						'org.threejs' +
					'</use>')
					__pragma__ ('<all>')
						__all__.clamp = clamp;
						__all__.now = now;
						__all__.pad_wrap = pad_wrap;
						__all__.sign = sign;
						__all__.three = three;
						__all__.wrap = wrap;
					__pragma__ ('</all>')
				}
			}
		}
	);
