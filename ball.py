import org.threejs as three
import random


def wrap(obj: three.Object3d):
    pos = obj.position

    if pos.x < -30:
        pos.x = 30
    elif pos.x > 30:
        pos.x = -30

    if pos.y < -30:
        pos.y = 30
    elif pos.y > 30:
        pos.y = -30

    obj.matrixWorld.setPosition(pos)


def clamp(val, low, high):
    return max(min(val, high), low)


def sign(val):
    if val > 0:
        return 1
    if val < 0:
        return -1
    return 0


def now():
    return __new__(Date)


def set_element(id, value):
    document.getElementById(id).innerHTML = value


class Keyboard:
    def __init__(self):
        self.keyboard = {0: False}
        self.handlers = {}

    def key_down(self, key):
        self.keyboard[key.key] = True

    def key_up(self, key):
        self.keyboard[key.key] = False

    def get(self, key):
        return self.keyboard.get(key, False)

    def get_axis(self, key):
        return self.handlers[key].value

    def add_handler(self, name, handler):
        self.handlers[name] = handler

    def update(self, interval):
        for _, eachhandler in self.handlers.items():
            eachhandler.update(self, interval)

    def clear(self, axis):
        self.handlers.get(axis).value = 0


class ControlAxis:
    __pragma__('kwargs')

    def __init__(self, positive_key: str, negative_key: str, attack=1, decay=0, deadzone=0.02):
        self.positive = positive_key
        self.negative = negative_key
        self.attack = attack
        self.decay = decay
        self.deadzone = deadzone
        self.value = 0

    __pragma__('nokwargs')

    def update(self, keyboard: Keyboard, interval: float):
        self.value -= (interval * self.decay * self.value)
        dz = abs(self.value) < self.deadzone
        if keyboard.get(self.positive):
            dz = False
            self.value += interval * self.attack
        if keyboard.get(self.negative):
            dz = False
            self.value -= interval * self.attack

        if dz:
            self.value = 0
        else:
            self.value = clamp(self.value, -1, 1)


WIDTH = window.innerWidth
HEIGHT = window.innerHeight
camera = None
renderer = None
cube = None
scene = None
last_frame = __new__(Date)
kb = Keyboard()
kb.add_handler('spin', ControlAxis('s', 'a', attack=1, decay=.6))
kb.add_handler('thrust', ControlAxis('w', 'z', attack=.75, decay=2, deadzone=.1))
kb.add_handler('fire', ControlAxis('q', 'b', attack=10))


class AABB:
    def __init__(self, width, height, center):
        self.hw = width / 2.0
        self.hh = width / 2.0
        self.position = center

    def contains(self, item):
        x = self.position.x
        y = self.position.y
        h = self.hh
        w = self.hw
        return  item.x > x - w and item.x < x + w and item.y > y - h and item.y < y + h

    def update(self, pos):
        self.position = pos

class Bullet:

    EXPIRES = 1
    RESET_POS = three.Vector3(0, 0, 1000)
    BULLET_SPEED = 50
    BULLET_POINTER = 0
    BULLETS = []

    def __init__(self):
        self.vector = three.Vector3(0,0,0)
        self.geo = three.Mesh(three.BoxGeometry(.25, .25, .25),
                              three.MeshBasicMaterial({'color': 0xffffff}))

        self.lifespan = 0
        self.momentum  = three.Vector3(0,0,0)
        self.reset()


    def update(self, t):

        if self.geo.position.z < 1000:
            self.lifespan += t
            if self.lifespan > self.EXPIRES:
                self.reset()
                return
            delta  = three.Vector3().copy(self.vector)
            delta.multiplyScalar(self.BULLET_SPEED * t)
            delta.add(self.momentum)
            current_pos = self.geo.position.add(delta)
            self.geo.position.set (current_pos.x, current_pos.y, current_pos.z)
            wrap(self.geo)

    def reset(self):
        self.lifespan = 0
        self.momentum = three.Vector3(0,0,0)
        self.geo.position.set(self.RESET_POS.x, self.RESET_POS.y, self.RESET_POS.z)

def make_bullets(scene, amount):
    for n in range(amount):
        b = Bullet()
        scene.add(b.geo)
        Bullet.BULLETS.append(b)

def fire(pos, vector, momentum):
    for eachbullet in Bullet.BULLETS:
        if eachbullet.geo.position.z >= 1000:

            eachbullet.geo.position.set(pos.x, pos.y, pos.z)
            eachbullet.vector = vector
            eachbullet.lifespan = 0
            eachbullet.momentum = three.Vector3().copy(momentum).multiplyScalar(.66)
            return
    print ("click")

class Ship:
    ROTATE_SPEED = 2.1
    THRUST = .075

    def __init__(self):
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

    def add(self, scn: three.Scene):
        scn.add(self.geo)

    def update(self, t):
        thrust = kb.get_axis('thrust')
        self.geo.rotateZ(kb.get_axis('spin') * self.ROTATE_SPEED * t * -1)

        if thrust > 0:
            thrust_amt = thrust * self.THRUST * t
            self.momentum = self.momentum.add(self.heading.multiplyScalar(thrust_amt))

        current_pos = self.geo.position
        self.geo.matrixWorld.setPosition(current_pos.add(self.momentum))
        self.exhaust.visible = thrust > 0

        if kb.get_axis('fire') == 1:
            fire(self.geo.position, self.heading,  self.momentum)
            kb.clear('fire')

    def get_heading(self) -> float:
        # return the local Y axis, since Z is 'up'
        return three.Vector3(self.geo.matrixWorld.elements[4],
                             self.geo.matrixWorld.elements[5],
                             self.geo.matrixWorld.elements[6])

    heading = property(get_heading)


class Asteroid:
    def __init__(self, max_radius):
        self.radius =  ((random.random() + 1) / 2.0) * max_radius

        self.geo = three.Mesh(
            three.SphereGeometry(self.radius),
            three.MeshNormalMaterial()
        )
        self.geo.position.set(random.random() * 60 - 30, random.random() * 60 - 30, 0)
        self.momentum = three.Vector3(random.random() - 0.5, random.random() - 0.5, 0)
        self.momentum.multiplyScalar(3)
        self.bbox = AABB(self.radius *2, self.radius * 2, self.geo.position)

    def add(self, scene: three.Scene):
        scene.add(self.geo)

    def update(self, t):
        self.geo.translateOnAxis(self.momentum, t)
        self.bbox.update(self.geo.position)


asteroids = [Asteroid(4.5) for a in range(6)]
ship = Ship()


def init():
    global renderer
    global camera
    global cube
    global scene
    scene = three.Scene()
    camera = three.PerspectiveCamera(70, WIDTH / HEIGHT, 1, 500)
    camera.position.set(0, 0, 50)
    camera.lookAt(scene.position)

    renderer = three.WebGLRenderer({'Antialias': True})
    renderer.setSize(WIDTH, HEIGHT)

    ship.add(scene)
    for item in asteroids:
        item.add(scene)

    make_bullets(scene, 8)

    document.getElementById("XX").appendChild(renderer.domElement)
    document.onkeydown = kb.key_down
    document.onkeyup = kb.key_up


def render():
    global scene
    global cube
    global renderer
    global last_frame
    global VELOCITY


    if len(asteroids) == 0:
        print ("GAME OVER")
        document.getElementById("ZZ").innerHTML = "<h1>GAME OVER</h1>"
        return

    requestAnimationFrame(render)

    t = (__new__(Date) - last_frame) / 1000.0
    kb.update(t)

    dead = []
    for b in Bullet.BULLETS:
        if b.geo.position.z < 1000:
            for a in asteroids:
                if a.bbox.contains(b.geo.position):
                    d = a.geo.position.distanceTo(b.geo.position)
                    if d < a.radius:
                        b.reset()
                        dead.append(a)
    for d in dead:
        asteroids.remove(d)
        d.geo.visible = False
        if d.radius > 1.5:
            new_asteroids = random.randint(2, 4)
            for n in range(new_asteroids):
                new_a = Asteroid(d.radius / new_asteroids)
                new_a.geo.position.set(d.geo.position.x, d.geo.position.y, 0)
                new_a.add(scene)
                asteroids.append(new_a)

    for b in Bullet.BULLETS:
        b.update(t)

    ship.update(t)
    wrap(ship.geo)
    for item in asteroids:
        item.update(t)
        wrap(item.geo)




    renderer.render(scene, camera)
    last_frame = __new__(Date)


init()
render()
