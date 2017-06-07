import random

import org.threejs as three
from controls import Keyboard, ControlAxis
from units import Ship, Asteroid, Bullet
from utils import wrap, now, pad_wrap


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
        self.keyboard.add_handler('spin', ControlAxis('ArrowRight', 'ArrowLeft', attack=1, decay=.6))
        self.keyboard.add_handler('thrust', ControlAxis('ArrowUp', 'ArrowDown', attack=.75, decay=2, deadzone=.1))
        self.keyboard.add_handler('fire', ControlAxis(' ', 'None', attack=10))
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
            x = random.random() - 0.5
            y = random.random() - 0.5
            z = 0
            offset = three.Vector3(x, y, z)
            offset.normalize();
            push = random.randint(12, 27)
            offset = offset.multiplyScalar(push)

            r = (random.random() + 1.0) * 2.5
            asteroid = Asteroid(r, offset)

            mx = random.random() + random.random() + random.random(2) - 2.0
            my = random.random() + random.random() + random.random(2) - 2.0
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

        # controls
        self.handle_input(t)


        # clean up bullets, check for collisions
        dead = []
        for b in self.bullets:
            if b.position.z < 1000:
                for a in self.asteroids:
                    if a.bbox.contains(b.position):
                        d = a.geo.position.distanceTo(b.position)
                        if d < a.radius:
                            b.reset()
                            dead.append(a)
        for d in dead:
            self.asteroids.remove(d)
            d.geo.visible = False
            if d.radius > 1.5:
                new_asteroids = random.randint(2, 5)
                for n in range(new_asteroids):
                    new_a = Asteroid((d.radius + 1.0) / new_asteroids, d.position)
                    mx = random.random() + random.random(3) - 2.0
                    my = random.random() + random.random(3) - 2.0
                    new_a.momentum = three.Vector3().copy(d.momentum)
                    new_a.momentum.add(three.Vector3(mx, my, 0))
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

    def handle_input(self, t):

        if self.keyboard.get_axis('fire') >= 1:
            mo = three.Vector3().copy(self.ship.momentum).multiplyScalar(t)
            self.fire(self.ship.position, self.ship.heading, mo)
            self.keyboard.clear('fire')

        spin = self.keyboard.get_axis('spin')
        self.ship.spin(spin * t)

        thrust = self.keyboard.get_axis('thrust')
        self.ship.thrust(thrust * t)


    def fire(self, pos, vector, momentum, t):
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
