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
kb.add_handler('fire', ControlAxis('q', 'b', attack=1))


class Bullet:

    EXPIRES = 1.5
    RESET_POS = three.Vector3(0, 0, 1000)
    BULLET_SPEED = 12
    BULLET_POINTER = 0
    BULLETS = []

    def __init__(self):
        self.vector = three.Vector3(0,0,0)
        self.geo = three.Mesh(three.BoxGeometry(1, 1, 1),
                              three.MeshBasicMaterial({'color': 0xffffff}))
        self.lifespan = 0
        self.reset()

    def update(self, t):
        if self.geo.visible:
            self.lifespan += t
            if self.lifespan > self.EXPIRES:
                self.reset()
                return
            #momentum  = self.vector.multiplyScalar(self.BULLET_SPEED * t)
            #current_pos = self.geo.position
            #self.geo.matrixWorld.setPosition(current_pos.add(momentum))

    def reset(self):
        self.geo.visible = False
        self.geo.matrixWorld.setPosition(self.RESET_POS)


def make_bullets(scene, amount):
    Bullet.BULLETS = [Bullet() for n in range(amount)]
    for b in Bullet.BULLETS:
        scene.add(b.geo)


def fire(pos, vector):
    for eachbullet in Bullet.BULLETS:
        if not eachbullet.geo.visible:
            eachbullet.geo.matrixWorld.setPosition(pos)
            eachbullet.vector = vector
            eachbullet.lifespan = 0
            eachbullet.geo.visible = True

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
            fire(self.geo.position, self.heading)
            print("fire", self.geo.position.x, self.geo.position.y)
            kb.clear('fire')

    def get_heading(self) -> float:
        # return the local Y axis, since Z is 'up'
        return three.Vector3(self.geo.matrixWorld.elements[4],
                             self.geo.matrixWorld.elements[5],
                             self.geo.matrixWorld.elements[6])

    heading = property(get_heading)


class Asteroid:
    def __init__(self):
        self.geo = three.Mesh(
            three.SphereGeometry(random.randint(1, 3)),
            three.MeshNormalMaterial()
        )
        self.geo.position.set(random.random() * 10, random.random() * 10, 0)
        self.momentum = three.Vector3(random.random() - 0.5, random.random() - 0.5, random.random() - 0.5)
        self.momentum.multiplyScalar(3)

    def add(self, scene: three.Scene):
        scene.add(self.geo)

    def update(self, t):
        self.geo.translateOnAxis(self.momentum, t)


asteroids = [Asteroid() for a in range(6)]
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

    requestAnimationFrame(render)

    t = (__new__(Date) - last_frame) / 1000.0
    kb.update(t)

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
