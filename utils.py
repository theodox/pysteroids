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
