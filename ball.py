import org.threejs as three
from  org.threejs.line import make_line
import math

print("hi")


def now():
    return __new__(Date)


def set_element(id, value):
    document.getElementById(id).innerHTML = value


WIDTH = window.innerWidth
HEIGHT = window.innerHeight
camera = None
renderer = None
cube = None
scene = None
last_frame = __new__(Date)


def init():
    global renderer
    global camera
    global cube
    global scene
    scene = three.Scene()
    camera = three.PerspectiveCamera(70, WIDTH / HEIGHT, 1, 10)
    camera.position.set(0, 3.5, 5)
    camera.lookAt(scene.position)

    renderer = three.WebGLRenderer({'Antialias': True})
    renderer.setSize(WIDTH, HEIGHT)

    cube = three.Mesh(
        three.BoxGeometry(2, 2, 2),
        three.MeshNormalMaterial()
    )
    scene.add(cube)

    points = [three.Vector2(math.sin(i * 0.2) * 10 + 5, (i - 5) * 2) for i in range(10)]
    lg = three.LatheGeometry(points)
    lathe = three.Mesh(
        lg,
        three.MeshNormalMaterial({'color': 0xffff00})
    )
    scene.add(lathe)
    print(lg)
    line = make_line(0x0000ff, (-10,0,0), (0,10,0), (10,0,0))

    document.getElementById("XX").appendChild(renderer.domElement)


def render():
    global scene
    global cube
    global renderer
    global last_frame
    requestAnimationFrame(render)

    t = (__new__(Date) - last_frame) / 1000.0

    SPEED = 4
    cube.rotation.x -= SPEED * t
    cube.rotation.y -= SPEED * t * .3

    renderer.render(scene, camera)
    set_element("ZZ", t * 1000)
    last_frame = __new__(Date)


class Game:
    window = window

    def __init__(self):
        self.canvas = None
        self.context = None
        self.fps = 30
        self.start_time = now()
        self.last_frame = now()
        self.width = 0
        self.height = 0
        self.x = 17
        self.y = 91
        self.dx = 100
        self.dy = 100
        self.hud = None

    def update(self):

        current = now()
        elapsed = current - self.last_frame
        cx = self.context
        cx.clearRect(0, 0, self.width, self.height)
        cx.beginPath()
        cx.arc(self.x, self.y, 10, 0, Math.PI * 360)
        cx.fill()
        tmp = elapsed / 1000.0

        if self.x > self.width:
            self.dx = -98

        if self.x < 1:
            self.dx = 102

        if self.y > self.height:
            self.dy = -97

        if self.y < 1:
            self.dy = 103

        self.x = self.x + (self.dx * tmp)
        self.y = self.y + (self.dy * tmp)

        self.last_frame = current
        set_element("FPS", tmp)
        set_element("X", int(self.x))
        set_element("Y", int(self.y))
        window.requestAnimationFrame(self.update)

    def start(self):
        self.canvas = document.getElementById('canvas')
        self.context = self.canvas.getContext('2d')
        self.width = self.canvas.width
        self.height = self.canvas.height

        document.getElementById("FPS").innerHTML = "zzz"

        self.update()


init()
render()

# engine = Game()
