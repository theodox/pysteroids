import org.threejs as three
import random



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
        self.keyboard = {0:False}
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

    def update (self, interval):
        for _, eachhandler in self.handlers.items():
            eachhandler.update(self, interval)


class ControlAxis:

    __pragma__('kwargs')
    def __init__(self, positive_key, negative_key, attack=1, decay=0):
        self.positive = positive_key
        self.negative = negative_key
        self.attack = attack
        self.decay = decay
        self.value = 0
    __pragma__('nokwargs')

    def update(self, keyboard, interval):
        self.value -= (interval * self.decay * self.value)
        if keyboard.get(self.positive):
            self.value += interval * self.attack
        if keyboard.get(self.negative):
            self.value -= interval * self.attack
        self.value = clamp(self.value, -1, 1)




WIDTH = window.innerWidth
HEIGHT = window.innerHeight
camera = None
renderer = None
cube = None
scene = None
last_frame = __new__(Date)
kb = Keyboard()
kb.add_handler('spin', ControlAxis('s', 'a', attack = 1, decay= 0.49))



RX = 0





class Asteroid:

    def __init__(self):
        self.geo = three.Mesh(
            three.SphereGeometry(random.randint(1,3)),
            three.MeshNormalMaterial()
        )
        self.geo.position.set(random.random() * 10, random.random() * 10, 0)
        self.momentum = three.Vector3(random.random() - 0.5, random.random() - 0.5, random.random()-0.5)
        self.momentum.multiplyScalar(3)


    def add(self, scene):
        scene.add(self.geo)

    def update(self, t):


        self.geo.translateOnAxis(self.momentum, t)


asteroids = [Asteroid() for a in range(6)]

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

    cube = three.Mesh(
        three.BoxGeometry(2, 2, 2),
        three.MeshNormalMaterial()
    )
    scene.add(cube)


    for item in asteroids:
        item.add(scene)

    document.getElementById("XX").appendChild(renderer.domElement)
    document.onkeydown = kb.key_down
    document.onkeyup = kb.key_up

def render():
    #nonlocal  RX
    global scene
    global cube
    global renderer
    global last_frame
    requestAnimationFrame(render)

    t = (__new__(Date) - last_frame) / 1000.0
    kb.update(t)

    SPEED = 4
    cube.position.y = kb.get_axis('spin') * 45
    cube.rotation.y -= SPEED * t * .3

    for item in asteroids:
        item.update(t)

    renderer.render(scene, camera)
    set_element("ZZ", t * 1000)
    last_frame = __new__(Date)



init()
render()

# engine = Game()
