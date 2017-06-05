from org import threejs as three


def pad_wrap(min, max, val):
    if val < min:
        return max
    if val > max:
        return min
    return val


def wrap(obj: three.Object3d):
    WRAP = 30
    NWRAP = -30
    x, y, z = obj.position.x, obj.position.y, obj.position.z
    x = pad_wrap(NWRAP, WRAP, x)
    y = pad_wrap(NWRAP, WRAP, y)
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
