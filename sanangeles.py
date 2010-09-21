# San Angeles Observation
# Original C version Copyright 2004-2005 Jetro Lauha
# Web: http://iki.fi/jetro/
# 
# BSD-license.
#
# Javascript version by Ken Waters
# Skulpt (Python) version by Scott Graham

import webgl

ShapeParams = [
    # m  a     b     n1      n2     n3     m     a     b     n1     n2      n3   res1 res2 scale  (org.res1,res2)
    [10, 1,    2,    90,      1,   -45,    8,    1,    1,    -1,     1,  -0.4 ,   20,  30, 2], # 40, 60
    [10, 1,    2,    90,      1,   -45,    4,    1,    1,    10,     1,  -0.4 ,   20,  20, 4], # 40, 40
    [10, 1,    2,    60,      1,   -10,    4,    1,    1,    -1,    -2,  -0.4 ,   41,  41, 1], # 82, 82
    [ 6, 1,    1,    60,      1,   -70,    8,    1,    1,  0.4 ,     3,  0.25 ,   20,  20, 1], # 40, 40
    [ 4, 1,    1,    30,      1,    20,   12,    1,    1,  0.4 ,     3,  0.25 ,   10,  30, 1], # 20, 60
    [ 8, 1,    1,    30,      1,    -4,    8,    2,    1,    -1,     5,   0.5 ,   25,  26, 1], # 60, 60
    [13, 1,    1,    30,      1,    -4,   13,    1,    1,     1,     5,      1,   30,  30, 6], # 60, 60
    [10, 1, 1.1 , -0.5 ,   0.1 ,    70,   60,    1,    1,   -90,     0, -0.25 ,   20,  60, 8], # 60, 180
    [ 7, 1,    1,    20,  -0.3 , -3.5 ,    6,    1,    1,    -1,  4.5 ,   0.5 ,   10,  20, 4], # 60, 80
    [ 4, 1,    1,    10,     10,    10,    4,    1,    1,    10,    10,     10,   10,  20, 1], # 20, 40
    [ 4, 1,    1,     1,      1,     1,    4,    1,    1,     1,     1,      1,   10,  10, 2], # 10, 10
    [ 1, 1,    1,    38, -0.25 ,    19,    4,    1,    1,    10,    10,     10,   10,  15, 2], # 20, 40
    [ 2, 1,    1,  0.7 ,   0.3 ,  0.2 ,    3,    1,    1,   100,   100,    100,   10,  25, 2], # 20, 50
    [ 6, 1,    1,     1,      1,     1,    3,    1,    1,     1,     1,      1,   30,  30, 2], # 60, 60
    [ 3, 1,    1,     1,      1,     1,    6,    1,    1,     2,     1,      1,   10,  20, 2], # 20, 40
    [ 6, 1,    1,     6,   5.5 ,   100,    6,    1,    1,    25,    10,     10,   30,  20, 2], # 60, 40
    [ 3, 1,    1,  0.5 ,   1.7 ,  1.7 ,    2,    1,    1,    10,    10,     10,   20,  20, 2], # 40, 40
    [ 5, 1,    1,  0.1 ,   1.7 ,  1.7 ,    1,    1,    1,  0.3 ,  0.5 ,   0.5 ,   20,  20, 4], # 40, 40
    [ 2, 1,    1,     6,   5.5 ,   100,    6,    1,    1,     4,    10,     10,   10,  22, 1], # 40, 40
    [ 6, 1,    1,    -1,     70,  0.1 ,    9,    1, 0.5 ,   -98, 0.05 ,    -45,   20,  30, 4], # 60, 91
    [ 6, 1,    1,    -1,     90, -0.1 ,    7,    1,    1,    90,  1.3 ,     34,   13,  16, 1]  # 32, 60
]


class CamTrack:
    def __init__(self, src, dest, dist, len):
        self.src = src
        self.dest = dest
        self.dist = dist
        self.len = len
CamTracks = [
    CamTrack([4500, 2700, 100, 70, -30], [50, 50, -90, -100, 0], 20, 1),
    CamTrack([ -1448, 4294, 25, 363, 0 ], [ -136, 202, 125, -98, 100], 0, 1),
    CamTrack([ 1437, 4930, 200, -275, -20 ], [ 1684, 0, 0, 9, 0], 0, 1),
    CamTrack([ 1800, 3609, 200, 0, 675 ], [ 0, 0, 0, 300, 0], 0, 1),
    CamTrack([ 923, 996, 50, 2336, -80 ], [ 0, -20, -50, 0, 170], 0, 1),
    CamTrack([ -1663, -43, 600, 2170, 0 ], [ 20, 0, -600, 0, 100], 0, 1),
    CamTrack([ 1049, -1420, 175, 2111, -17 ], [ 0, 0, 0, -334, 0], 0, 2),
    CamTrack([ 0, 0, 50, 300, 25 ], [ 0, 0, 0, 300, 0], 70, 2),
    CamTrack([ -473, -953, 3500, -353, -350 ], [ 0, 0, -2800, 0, 0], 0, 2),
    CamTrack([ 191, 1938, 35, 1139, -17 ], [ 1205, -2909, 0, 0, 0], 0, 2),
    CamTrack([ -1449, -2700, 150, 0, 0 ], [ 0, 2000, 0, 0, 0], 0, 2),
    CamTrack([ 5273, 4992, 650, 373, -50 ], [ -4598, -3072, 0, 0, 0], 0, 2),
    CamTrack([ 3223, -3282, 1075, -393, -25 ], [ 1649, -1649, 0, 0, 0], 0, 2),
]

CAMTRACK_LEN = 5442

FlatVertexSource = """
attribute vec3 pos;
attribute vec4 colorIn;
uniform mat4 mvp;
varying vec4 color;
void main() {
    color = colorIn;
    gl_Position = mvp * vec4(pos.xyz, 1.);
}
"""

FlatFragmentSource = """
#ifdef GL_ES
precision highp float;
#endif
varying vec4 color;
void main() {
    gl_FragColor = vec4(color.rgb, 1.0);
}
"""

LitVertexSource = """
attribute vec3 pos;
attribute vec3 normal;
attribute vec4 colorIn;

varying vec4 color;

uniform mat4 mvp;
uniform mat3 normalMatrix;
uniform vec4 ambient;
uniform float shininess;
uniform vec3 light_0_direction;
uniform vec4 light_0_diffuse;
uniform vec4 light_0_specular;
uniform vec3 light_1_direction;
uniform vec4 light_1_diffuse;
uniform vec3 light_2_direction;
uniform vec4 light_2_diffuse;

vec3 worldNormal;

vec4 SpecularLight(vec3 direction,
                   vec4 diffuseColor,
                   vec4 specularColor) {
    vec3 lightDir = normalize(direction);
    float diffuse = max(0., dot(worldNormal, lightDir));
    float specular = 0.;
    if (diffuse > 0.) {
        vec3 halfv = normalize(lightDir + vec3(0., 0., 1.));
        specular = pow(max(0., dot(halfv, worldNormal)), shininess);
    }
    return diffuse * diffuseColor * colorIn + specular * specularColor;
}

vec4 DiffuseLight(vec3 direction, vec4 diffuseColor) {
    vec3 lightDir = normalize(direction);
    float diffuse = max(0., dot(worldNormal, lightDir));
    return diffuse * diffuseColor * colorIn;
}

void main() {
    worldNormal = normalize(normalMatrix * normal);

    gl_Position = mvp * vec4(pos, 1.);

    color = ambient * colorIn;
    color += SpecularLight(light_0_direction, light_0_diffuse,
                           light_0_specular);
    color += DiffuseLight(light_1_direction, light_1_diffuse);
    color += DiffuseLight(light_2_direction, light_2_diffuse);
}
"""

FadeVertexSource = """
#ifdef GL_ES
precision highp float;
#endif
attribute vec2 pos;

varying vec4 color;

uniform float minFade;

void main() {
    color = vec4(minFade, minFade, minFade, 1.);
    gl_Position = vec4(pos, 0., 1.);
}
"""

class Random:
    def __init__(self, seed):
        self.randomSeed = seed
    def seed(self, seed):
        self.randomSeed = seed
    def uInt(self):
        self.randomSeed = (self.randomSeed * 0x343fd + 0x269ec3) & 0xffffffff
        return (self.randomSeed >> 16) & 0xfff

class GlObject:
    def __init__(self, gl, shader, vertices, colors, normals=None):
        self.shader = shader
        self.count = len(vertices) / 3
        self.vbo = gl.createBuffer()
        vertexArray = gl.Float32Array(vertices)
        colorArray = gl.Uint8Array(colors)
        self.vertexOffset = 0
        self.colorOffset = vertexArray.byteLength
        self.normalOffset = self.colorOffset + colorArray.byteLength
        sizeInBytes = self.normalOffset
        normalArray = None
        self.hasNormals = normals != None
        if normals:
            normalArray = gl.Float32Array(normals)
            sizeInBytes += normalArray.byteLength
        gl.bindBuffer(gl.ARRAY_BUFFER, self.vbo)
        gl.bufferData(gl.ARRAY_BUFFER, sizeInBytes, gl.STATIC_DRAW)
        gl.bufferSubData(gl.ARRAY_BUFFER, self.vertexOffset, vertexArray)
        gl.bufferSubData(gl.ARRAY_BUFFER, self.colorOffset, colorArray)
        if normals:
            gl.bufferSubData(gl.ARRAY_BUFFER, self.normalOffset, normalArray)
    def draw(self):
        self.shader.use()

        gl.bindBuffer(gl.ARRAY_BUFFER, self.vbo)
        gl.vertexAttribPointer(self.shader.posLoc, 3, gl.FLOAT, False, 0, self.vertexOffset)
        gl.enableVertexAttribArray(self.shader.posLoc)
        gl.vertexAttribPointer(self.shader.colorInLoc, 4, gl.UNSIGNED_BYTE, True, 0, self.colorOffset)
        gl.enableVertexAttribArray(self.shader.colorInLoc)

        if self.hasNormals:
            gl.vertexAttribPointer(self.shader.normalLoc, 3, gl.FLOAT, False, 0, self.normalOffset)
            gl.enableVertexAttribArray(self.shader.normalLoc)

        gl.drawArrays(gl.TRIANGLES, 0, self.count)

        if self.hasNormals:
            gl.disableVertexAttribArray(self.shader.normalLoc)
        gl.disableVertexAttribArray(self.shader.colorInLoc)
        gl.disableVertexAttribArray(self.shader.posLoc)

def createGroundPlane(gl, shader, random):
    scale = 4
    xBegin, xEnd = -15, 15
    yBegin, yEnd = -15, 15
    triangleCount = (yEnd - yBegin) * (xEnd - xBegin) * 2
    colors = []
    vertices = []

    for y in range(yBegin, yEnd):
        for x in range(xBegin, xEnd):
            color = (random.uInt() & 0x4f) + 81
            for i in range(6):
                colors.extend([color, color, color, 0])
            for i in range(6):
                xm = x + ((0x1c >> a) & 1)
                ym = y + ((0x31 >> a) & 1)
                m = math.cos(xm * 2) * math.sin(ym * 4) * 0.75
                vertices.extend([xm * scale + m, ym * scale + m, 0])
    return GlObject(shader, vertices, colors)

ground = None
fadeVBO = None
shapes = None
modelview = None
projection = None
mvp = None
normalMatrix = None
currentCamTrackStartTick = 0
nextCamTrackStartTick = 0
sTick = 0
currentCamTrack = 0

def main():
    global gl, random, modelview, projection, mvp, normalMatrix

    modelview = webgl.Mat44()
    projection = webgl.Mat44()
    mvp = webgl.Mat44()
    normalMatrix = webgl.Mat33()

    gl = webgl.GL("canv")

    gl.enable(gl.DEPTH_TEST)
    gl.disable(gl.CULL_FACE)

    random = Random(15)

    flatShader = webgl.Shader(gl, FlatVertexSource, FlatFragmentSource)
    litShader = webgl.Shader(gl, LitVertexSource, FlatFragmentSource)
    fadeShader = webgl.Shader(gl, FadeVertexSource, FlatFragmentSource)

    # bind non-changing lighting parameters
    litShader.use()
    gl.uniform4f(litShader.ambientLoc, .2, .2, .2, 1.)
    gl.uniform4f(litShader.light_0_diffuseLoc, 1., .4, 0, 1.)
    gl.uniform4f(litShader.light_1_diffuseLoc, .07, .14, .35, 1.)
    gl.uniform4f(litShader.light_2_diffuseLoc, .07, .17, .14, 1.)
    gl.uniform4f(litShader.light_0_specularLoc, 1., 1., 1., 1.)
    gl.uniform1f(litShader.shininessLoc, 60.)

    shapes = [createSuperShape(litShader, x) for x in ShapeParams]
    ground = createGroundPlane(flatShader)

def clamp(x, mn=0, mx=255):
    return max(min(x, mx), mn)

def superShapeMap(r1, r2, t, p):
    return gl.Vec3(math.cos(t) * math.cos(p) / r1 / r2,
                   math.sin(t) * math.cos(p) / r1 / r2,
                   math.sin(p) / r2)

def ssFunc(t, p):
    return pow(pow(abs(cos(p[0] * t / 4)) / p[1], p[4]) +
               pow(abs(sin(p[0] * t / 4)) / p[2], p[5]),
               1.0 / p[3])

def createSuperShape(shader, params):
    resol1 = params[-3]
    resol2 = params[-2]
    # latitude 0 to pi/2 for no mirrored bottom
    # (latitudeBegin==0 for -pi/2 to pi/2 originally)
    latitudeBegin = resol2 / 4
    latitudeEnd = resol2 / 2
    longitudeCount = resol1

    vertices = []
    colors = []
    normals = []

    baseColor = [(random.uInt() % 155 + 100) / 255.0 for x in range(3)]

    currentVertex = 0

    for longitude in range(longitudeCount):
        for latitude in range(latitudeBegin, latitudeEnd):
            t1 = -math.pi + longitude * 2 * math.pi / resol1
            t2 = -math.pi + (longitute + 1) * 2 * math.pi / resol1
            p1 = -math.pi / 2 + latitude * 2 * math.pi / resol2
            p2 = -math.pi / 2 + (latitude + 1) * 2 * math.pi / resol2

            r0 = ssFunc(t1, params)
            r1 = ssFunc(p1, params[6:])
            r2 = ssFunc(t2)
            r3 = ssFunc(p2, params[6:])

            if r0 and r1 and r2 and r3:
                pa = superShapeMap(r0, r1, t1, p1)
                pb = superShapeMap(r2, r1, t2, p1)
                pc = superShapeMap(r2, r3, r2, p2)
                pd = superShapeMap(r0, r3, t1, p2)
                
                # kludge to set lower edge of the object to fixed level
                if latitude == latitudeBegin + 1:
                    pa.z = pb.z = 0

                v1 = pb - pa
                v2 = pd - pa

                n = gl.cross(v1, v2)

                
                # Pre-normalization of the normals is disabled here because
                # they will be normalized anyway later due to automatic
                # normalization (NORMALIZE). It is enabled because the
                # objects are scaled with scale.
                #
                # Note we have to normalize by hand in the shader
                ca = pa.z + 0.5
                for i in range(6):
                    normals.extend([n.x, n.y, n.z])

                for i in range(6):
                    colors.append(clamp(ca * baseColor[0] * 255))
                    colors.append(clamp(ca * baseColor[1] * 255))
                    colors.append(clamp(ca * baseColor[2] * 255))
                    colors.append(0)

                vertices.extend([pa.x, pa.y, pa.z])
                vertices.extend([pb.x, pb.y, pb.z])
                vertices.extend([pd.x, pd.y, pd.z])
                vertices.extend([pb.x, pb.y, pb.z])
                vertices.extend([pc.x, pc.y, pc.z])
                vertices.extend([pd.x, pd.y, pd.z])

    return GlObject(gl, shader, vertices, colors, normals)

def configureLightAndMaterial():
    l0 = modelview.transform3(Vec3(-4., 1., 1.))
    l1 = modelview.transform3(Vec3(1., -2., -1.))
    l2 = modelview.transform3(Vec3(-1., 0., -4.))

    litShader.use()
    gl.uniform3f(litShader.light_0_directionLoc, l0.x, l0.y, l0.z)
    gl.uniform3f(litShader.light_1_directionLoc, l1.x, l1.y, l1.z)
    gl.uniform3f(litShader.light_2_directionLoc, l2.x, l2.y, l2.z)

def drawModels(zScale):
    translationScale = 9
    modelview.scale(1, 1, zScale)
    random.seed(9)

    for y in range(-5, 5):
        for x in range(-5, 5):
            curShape = random.uInt() % len(ShapeParams)
            buildingScale = ShapeParams[curShape][-1]

            modelview.push()
            modelview.translate(x * translationScale, y * translationScale, 0)

            rv = random.uInt() % 360
            modelview.rotate(-rv, 0, 0, 1)
            modelview.scale(buildingScale, buildingScale, buildingScale)

            shapes[curShape].draw()

            modelview.pop()

    ship = shapes[-1]
    for x in range(-2, 2):
        shipScale100 = translationScale * 500
        offs100 = x * shipScale100 + (sTick % shipScale100)
        offs = 0.01 * offs100

        modelview.push()
        modelview.translate(offs, -4.0, 2.0)
        ship.draw()
        modelview.pop()

        modelview.push()
        modelview.translate(-4., offs, 4.)
        modelview.rotate(-90., 0., 0., 1.)
        ship.draw()
        modelview.pop()

def camTrack():

    nextCamTrackStartTick = currentCamTrackStartTick + CamTracks[currentCamTrack].len * CAMTRACK_LEN
    while nextCamTrackStartTick <= sTick:
        ++currentCamTrack
        if currentCamTrack >= len(CamTracks):
            currentCamTrack = 0
        currentCamTrackStartTick = nextCamTrackStartTick
        nextCamTrackStartTick = currentCamTrackStartTick + CamTracks[currentCamTrack].len * CAMTRACK_LEN

    cam = CamTracks[currentCamTrack]
    currentCamTick = sTick - currentCamTrackStartTick
    trackPos = currentCamTick / (CAMTRACK_LEN * cam.len)

    lerp = [0.01 * cam.src[a] + cam.dest[a] * trackPos for a in range(5)]

    if cam.dist:
        dist = cam.dist * 0.1
        cX = lerp[0]
        cY = lerp[1]
        cZ = lerp[2]
        eX = cX - math.cos(lerp[3]) * dist
        eY = cY - math.sin(lerp[3]) * dist
        eZ = cZ - lerp[4]
    else:
        eX = lerp[0]
        eY = lerp[1]
        eZ = lerp[2]
        cX = eX + math.cos(lerp[3])
        cY = eY + math.sin(lerp[3])
        cZ = eZ + lerp[4]

    modelview.lookAt(eX, eY, eZ, cX, cY, cZ, 0, 0, 1)

def drawGroundPlane():
    gl.disable(gl.CULL_FACE)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.ZERO, gl.SRC_COLOR)

    ground.draw()

    gl.disable(gl.BLEND)
    gl.enable(gl.DEPTH_TEST)

def drawFadeQuad():
    global fadeVBO
    if not fadeVBO:
        vertices = gl.Float32Array([
            -1, -1,
            1, -1,
            -1, 1,
            1, -1,
            1, 1,
            -1, 1])
        fadeVBO = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, fadeVBO)
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)

    beginFade = sTick - currentCamTrackStartTick
    endFade = nextCamTrackStartTick - sTick
    minFade = min(beginFade, endFade)

    if minFade < 1024:
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.ZERO, gl.SRC_COLOR)
        fadeShader.use()
        gl.uniform1f(fadeShader.minFadeLoc, minFade / 1024.0)

        gl.bindBuffer(gl.ARRAY_BUFFER, fadeVBO)
        gl.vertexAttribPointer(fadeShader.posLoc, 2, gl.FLOAT, false, 0, 0)
        gl.enableVertexAttribArray(fadeShader.posLoc)
        gl.drawArrays(gl.TRIANGLES, 0, 6)
        gl.disableVertexAttribArray(fadeShader.posLoc)

        gl.disable(gl.BLEND)
        gl.enable(gl.DEPTH_TEST)

def draw(gl, width, height):
    sTick = (sTick + tick) / 2

    gl.clearColor(0.1, 0.2, 0.3, 1.0)
    gl.clear(gl.DEPTH_BUFFER_BIT | gl.COLOR_BUFFER_BIT)

    projection.loadIdentity()
    projection.perspective(45, width / height, 0.5, 100)
    modelview.loadIdentity()

    camTrack()

    configureLightAndMaterial()

    modelview.push()
    drawModels(-1)
    modelview.pop()

    drawGroundPlane()

    drawModels(1)

    drawFadeQuad()

main()
