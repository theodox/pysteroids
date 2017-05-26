	__nest__ (
		__all__,
		'org.threejs.line', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var three =  __init__ (__world__.org.threejs);
					var make_line = function (color) {
						var points = tuple ([].slice.apply (arguments).slice (1));
						var geo = three.Geometry ();
						for (var p of points) {
							geo.vertices.push (three.Vector3 (...p));
						}
						var mtl = three.LineBasicMaterial (dict ({'color': color}));
						return three.Line (geo, mtl);
					};
					__pragma__ ('<use>' +
						'org.threejs' +
					'</use>')
					__pragma__ ('<all>')
						__all__.make_line = make_line;
					__pragma__ ('</all>')
				}
			}
		}
	);
