import random

from org import threejs as three
from utils import wrap, AABB


class Unit:
    def __init__(self):
        self.geo = None
        self.momentum = three.Vector3(0, 0, 0)

    def get_position(self):
        return self.geo.position

    position = property(get_position)


class Ship(Unit):
    ROTATE_SPEED = 2.1
    THRUST = .075

    def __init__(self, keyboard, game):
        Unit.__init__(self)
        self.keyboard = keyboard

        self.geo = three.Mesh(
            three.BoxGeometry(2, 3, 2),
            three.MeshNormalMaterial()
        )
        exhaust = three.Mesh(
            three.BoxGeometry(1, 2, 1),
            three.MeshBasicMaterial({'color': 0xffff00})
        )
        self.geo.add(exhaust)
        exhaust.translateY(-2)
        self.exhaust = exhaust
        self.momentum = three.Vector3(0, 0, 0)
        self.keyboard = keyboard
        self.bbox = AABB(2, 2, self.geo.position)
        self.game = game

    def update(self, t):
        thrust = self.keyboard.get_axis('thrust')
        self.geo.rotateZ(self.keyboard.get_axis('spin') * self.ROTATE_SPEED * t * -1)

        if thrust > 0:
            thrust_amt = thrust * self.THRUST * t
            self.momentum = self.momentum.add(self.heading.multiplyScalar(thrust_amt))

        current_pos = self.geo.position
        self.geo.matrixWorld.setPosition(current_pos.add(self.momentum))
        self.exhaust.visible = thrust > 0

        if self.keyboard.get_axis('fire') > 0.25:
            self.game.fire(self.geo.position, self.heading, self.momentum)
            self.keyboard.clear('fire')
        self.bbox.update(self.position)

    def get_heading(self) -> float:
        # return the local Y axis, since Z is 'up'
        return three.Vector3(self.geo.matrixWorld.elements[4],
                             self.geo.matrixWorld.elements[5],
                             self.geo.matrixWorld.elements[6])

    heading = property(get_heading)


class Asteroid:
    def __init__(self, radius, pos):
        self.radius = radius
        self.geo = three.Mesh(
            three.SphereGeometry(self.radius),
            three.MeshNormalMaterial()
        )
        self.geo.position.set(pos)
        self.bbox = AABB(self.radius * 2, self.radius * 2, self.geo.position)

    def update(self, t):
        self.geo.translateOnAxis(self.momentum, t)
        self.bbox.update(self.position)


class Bullet():
    EXPIRES = 1
    RESET_POS = three.Vector3(0, 0, 1000)
    BULLET_SPEED = 50

    def __init__(self):
        self.vector = three.Vector3(0, 0, 0)
        self.geo = three.Mesh(
            three.BoxGeometry(.25, .25, .25),
            three.MeshBasicMaterial({'color': 0xffffff})
        )
        self.lifespan = 0
        self.momentum = three.Vector3(0, 0, 0)
        self.reset()

    def update(self, t):

        if self.geo.position.z < 1000:
            self.lifespan += t
            if self.lifespan > self.EXPIRES:
                self.reset()
                return
            delta = three.Vector3().copy(self.vector)
            delta.multiplyScalar(self.BULLET_SPEED * t)
            delta.add(self.momentum)
            current_pos = self.geo.position.add(delta)
            self.geo.position.set(current_pos.x, current_pos.y, current_pos.z)
            wrap(self.geo)

    def reset(self):
        self.lifespan = 0
        self.momentum = three.Vector3(0, 0, 0)
        self.geo.position.set(self.RESET_POS.x, self.RESET_POS.y, self.RESET_POS.z)



    def get_position(self):
        return self.geo.position

    position = property(get_position)
