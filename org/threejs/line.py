from org.threejs import Geometry, LineBasicMaterial, Line, Vector3



def make_line(color, *points ):
    geo = Geometry()
    for p in points:
        geo.vertices.push(Vector3(p))
    mtl = LineBasicMaterial({'color': color})
    return Line(geo, mtl)