import org.threejs as three

def make_line(color, *points):
    geo = three.Geometry()
    for p in points:
        geo.vertices.push(three.Vector3(*p))
    mtl = three.LineBasicMaterial({'color': color})
    return three.Line(geo, mtl)
