	__nest__ (
		__all__,
		'units', {
			__all__: {
				__inited__: false,
				__init__: function (__all__) {
					var random = {};
					__nest__ (random, '', __init__ (__world__.random));
					var three = __init__ (__world__.org.threejs);
					var wrap = __init__ (__world__.utils).wrap;
					var AABB = __init__ (__world__.utils).AABB;
					var Unit = __class__ ('Unit', [object], {
						get __init__ () {return __get__ (this, function (self) {
							self.geo = null;
							self.momentum = three.Vector3 (0, 0, 0);
						});},
						get get_position () {return __get__ (this, function (self) {
							return self.geo.position;
						});}
					});
					Object.defineProperty (Unit, 'position', property.call (Unit, Unit.get_position));;
					var Ship = __class__ ('Ship', [Unit], {
						ROTATE_SPEED: 2.1,
						THRUST: 0.075,
						get __init__ () {return __get__ (this, function (self, keyboard, game) {
							Unit.__init__ (self);
							self.keyboard = keyboard;
							self.geo = three.Mesh (three.BoxGeometry (2, 3, 2), three.MeshNormalMaterial ());
							var exhaust = three.Mesh (three.BoxGeometry (1, 2, 1), three.MeshBasicMaterial (dict ({'color': 16776960})));
							self.geo.add (exhaust);
							exhaust.translateY (-(2));
							self.exhaust = exhaust;
							self.momentum = three.Vector3 (0, 0, 0);
							self.keyboard = keyboard;
							self.bbox = AABB (2, 2, self.geo.position);
							self.game = game;
						});},
						get py_update () {return __get__ (this, function (self, t) {
							var thrust = self.keyboard.get_axis ('thrust');
							self.geo.rotateZ (((self.keyboard.get_axis ('spin') * self.ROTATE_SPEED) * t) * -(1));
							if (thrust > 0) {
								var thrust_amt = (thrust * self.THRUST) * t;
								self.momentum = self.momentum.add (self.heading.multiplyScalar (thrust_amt));
							}
							var current_pos = self.geo.position;
							self.geo.matrixWorld.setPosition (current_pos.add (self.momentum));
							self.exhaust.visible = thrust > 0;
							if (self.keyboard.get_axis ('fire') > 0.25) {
								self.game.fire (self.geo.position, self.heading, self.momentum);
								self.keyboard.py_clear ('fire');
							}
							self.bbox.py_update (self.position);
						});},
						get get_heading () {return __get__ (this, function (self) {
							return three.Vector3 (self.geo.matrixWorld.elements [4], self.geo.matrixWorld.elements [5], self.geo.matrixWorld.elements [6]);
						});}
					});
					Object.defineProperty (Ship, 'heading', property.call (Ship, Ship.get_heading));;
					var Asteroid = __class__ ('Asteroid', [object], {
						get __init__ () {return __get__ (this, function (self, radius, pos) {
							self.radius = radius;
							self.geo = three.Mesh (three.SphereGeometry (self.radius), three.MeshNormalMaterial ());
							self.geo.position.set (pos);
							self.bbox = AABB (self.radius * 2, self.radius * 2, self.geo.position);
						});},
						get py_update () {return __get__ (this, function (self, t) {
							self.geo.translateOnAxis (self.momentum, t);
							self.bbox.py_update (self.position);
						});}
					});
					var Bullet = __class__ ('Bullet', [object], {
						EXPIRES: 1,
						RESET_POS: three.Vector3 (0, 0, 1000),
						BULLET_SPEED: 50,
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
						});},
						get get_position () {return __get__ (this, function (self) {
							return self.geo.position;
						});}
					});
					Object.defineProperty (Bullet, 'position', property.call (Bullet, Bullet.get_position));;
					__pragma__ ('<use>' +
						'org.threejs' +
						'random' +
						'utils' +
					'</use>')
					__pragma__ ('<all>')
						__all__.AABB = AABB;
						__all__.Asteroid = Asteroid;
						__all__.Bullet = Bullet;
						__all__.Ship = Ship;
						__all__.Unit = Unit;
						__all__.three = three;
						__all__.wrap = wrap;
					__pragma__ ('</all>')
				}
			}
		}
	);
