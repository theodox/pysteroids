import random

import org.threejs as three
from controls import Keyboard, ControlAxis
from units import Ship, Asteroid, Bullet
from utils import wrap, now


class Graphics:
    def __init__(self, w, h, canvas):
        self.width = w
        self.height = h
        self.scene = three.Scene()
        self.camera = three.PerspectiveCamera(70, self.width / self.height, 1, 500)
        self.camera.position.set(0, 0, 50)
        self.camera.lookAt(self.scene.position)
        self.renderer = three.WebGLRenderer({'Antialias': True})
        self.renderer.setSize(self.width, self.height)
        canvas.appendChild(self.renderer.domElement)

    def render(self):
        self.renderer.render(self.scene, self.camera)

    def add(self, item):
        self.scene.add(item.geo)


class Game:
    def __init__(self, canvas):
        self.keyboard = Keyboard()
        self.graphics = Graphics(window.innerWidth, window.innerHeight, canvas)
        self.create_controls()
        self.ship = None
        self.bullets = []
        self.asteroids = []
        self.setup()
        self.last_frame = now()

    def create_controls(self):
        self.keyboard.add_handler('spin', ControlAxis('s', 'a', attack=1, decay=.6))
        self.keyboard.add_handler('thrust', ControlAxis('w', 'z', attack=.75, decay=2, deadzone=.1))
        self.keyboard.add_handler('fire', ControlAxis('q', 'b', attack=10))
        document.onkeydown = self.keyboard.key_down
        document.onkeyup = self.keyboard.key_up

    def setup(self):

        self.ship = Ship(self.keyboard, self)
        self.graphics.add(self.ship)

        def rsign():
            if random.random() < .5:
                return -1
            return 1

        for a in range(10):
            x = random.randint(15) + (rsign() * 15)
            y = random.randint(15) + (rsign() * 15)
            z = 0
            r = (random.random() + 1.0) * 2.5

            mx = ((random.random() + 1.0) * 4) - 2.0
            my = ((random.random() + 1.0) * 4) - 2.0
            asteroid = Asteroid(r, three.Vector3(x, y, z))
            asteroid.momentum = three.Vector3(mx, my, 0)
            self.graphics.add(asteroid)
            self.asteroids.append(asteroid)

        for b in range(8):
            bullet = Bullet()
            self.graphics.add(bullet)
            self.bullets.append(bullet)


    def tick(self):

        if len(self.asteroids) == 0:
            print("GAME OVER")
            document.getElementById("ZZ").innerHTML = "<h1>GAME OVER</h1>"
            return

        requestAnimationFrame(self.tick)

        t = (now() - self.last_frame) / 1000.0
        self.keyboard.update(t)

        # clean up bullets, check for collisions
        dead = []
        for b in self.bullets:
            if b.position.z < 1000:
                for a in self.asteroids:
                    if a.bbox.contains(b.geo.position):
                        d = a.geo.position.distanceTo(b.geo.position)
                        if d < a.radius:
                            b.reset()
                            dead.append(a)
        for d in dead:
            self.asteroids.remove(d)
            d.geo.visible = False
            if d.radius > 1.5:
                new_asteroids = random.randint(2, 5)
                for n in range(new_asteroids):
                    new_a = Asteroid((d.radius + 1.0) / new_asteroids)
                    new_a.geo.position.set(d.geo.position.x, d.geo.position.y, 0)
                    self.graphics.add(new_a)
                    self.asteroids.append(new_a)

        for b in self.bullets:
            b.update(t)

        self.ship.update(t)
        wrap(self.ship.geo)
        for item in self.asteroids:
            item.update(t)
            wrap(item.geo)

        self.graphics.render()
        self.last_frame = now()

    def fire(self, pos, vector, momentum):
        for each_bullet in self.bullets:
            if each_bullet.geo.position.z >= 1000:
                each_bullet.geo.position.set(pos.x, pos.y, pos.z)
                each_bullet.vector = vector
                each_bullet.lifespan = 0
                each_bullet.momentum = three.Vector3().copy(momentum).multiplyScalar(.66)
                return


class EventQueue:
    def __init__(self):
        self.events = {}

    def add_event(self, name, event):
        self.events[name] = event

    def remove_event(self, name):
        self.events.pop(name, None)


class Event:
    def __init__(self, name):
        self.name = name
        self.handlers = {}

    def subscribe(self, name, handler):
        self.handlers[name] = handler

    def unsubscribe(self, name):
        self.handlers.pop(name, None)

    def fire(self, *args):
        for k, v in self.handlers.items():
            v(*args)


canvas = document.getElementById("game_canvas")
game = Game(canvas)
game.tick()
