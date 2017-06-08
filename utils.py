from org import threejs as three

def pad_wrap(min, max, val):
    if val < min:
        return max
    if val > max:
        return min
    return val


def wrap(obj: three.Object3d):
    XWRAP = 70
    XNWRAP = -70
    YWRAP = 35
    YNWRAP = -35

    x, y, z = obj.position.x, obj.position.y, obj.position.z
    x = pad_wrap(XNWRAP, XWRAP, x)
    y = pad_wrap(YNWRAP, YWRAP, y)
    obj.position.set(x, y, z)


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
        return item.x > x - w and item.x < x + w and item.y > y - h and item.y < y + h

    def update(self, pos):
        self.position = pos


class FPSCounter:

    def __init__(self, hud_element):
        self.frames = [0.1]
        for n in range(99):
            self.frames.append(0.1)
        self.next_frame = 0
        self.average = 0
        self.visible = True
        self.element = hud_element

    def update(self, t):
        self.frames[self.next_frame] = t
        self.next_frame +=1
        if self.next_frame > 99:
            self.next_frame = 0

        sum = lambda a, b: a + b
        total = 0
        for n in range(100):
            total += self.frames[n]

        self.average = total * 10
        if self.visible:
            # @todo: need a string formatting option to print out decimal MS
            self.element.innerHTML = "{} fps".format(int(1000 / self.average))