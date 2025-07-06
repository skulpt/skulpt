# Sprite.py
# Unified Sprite library with position, rotation (pivot), drawing, collision with registry, hit-testing, and tweening support

import math

# --- Utility functions ---

def clamp(val, minval, maxval):
    return max(minval, min(maxval, val))

# --- Tweening support and easing functions ---

def linear_easing(t: float) -> float:
    """Linear easing function (no acceleration)."""
    return t

# --- New easing functions ---

def ease_in_quad(t: float) -> float:
    return t * t

def ease_out_quad(t: float) -> float:
    return t * (2 - t)

def ease_in_out_quad(t: float) -> float:
    return 2*t*t if t < 0.5 else -1 + (4 - 2*t)*t

def ease_in_cubic(t: float) -> float:
    return t * t * t

def ease_out_cubic(t: float) -> float:
    t1 = t - 1
    return t1 * t1 * t1 + 1

def ease_in_out_cubic(t: float) -> float:
    return 4*t*t*t if t < 0.5 else (t - 1)*(2*t - 2)*(2*t - 2) + 1

def ease_in_sine(t: float) -> float:
    import math
    return 1 - math.cos((t * math.pi) / 2)

def ease_out_sine(t: float) -> float:
    import math
    return math.sin((t * math.pi) / 2)

def ease_in_out_sine(t: float) -> float:
    import math
    return -(math.cos(math.pi * t) - 1) / 2

def ease_out_bounce(t: float) -> float:
    n1, d1 = 7.5625, 2.75
    if t < 1 / d1:
        return n1 * t * t
    elif t < 2 / d1:
        t2 = t - (1.5 / d1)
        return n1 * t2 * t2 + 0.75
    elif t < 2.5 / d1:
        t2 = t - (2.25 / d1)
        return n1 * t2 * t2 + 0.9375
    else:
        t2 = t - (2.625 / d1)
        return n1 * t2 * t2 + 0.984375

def ease_out_elastic(t: float) -> float:
    import math
    c4 = (2 * math.pi) / 3
    if t == 0:
        return 0
    if t == 1:
        return 1
    return math.pow(2, -10 * t) * math.sin((t * 10 - 0.75) * c4) + 1

# Mapping names to functions for convenience
EASINGS = {
    'linear': linear_easing,
    'ease_in_quad': ease_in_quad,
    'ease_out_quad': ease_out_quad,
    'ease_in_out_quad': ease_in_out_quad,
    'ease_in_cubic': ease_in_cubic,
    'ease_out_cubic': ease_out_cubic,
    'ease_in_out_cubic': ease_in_out_cubic,
    'ease_in_sine': ease_in_sine,
    'ease_out_sine': ease_out_sine,
    'ease_in_out_sine': ease_in_out_sine,
    'ease_out_bounce': ease_out_bounce,
    'ease_out_elastic': ease_out_elastic,
}

def register_easing(name: str, fn):
    """Register a custom easing function by name."""
    if callable(fn):
        EASINGS[name] = fn

class Tween:
    """Animates a single numeric property on a target over time."""
    def __init__(self, target, propertyName, endValue, duration, easing=None):
        self.target = target
        self.propertyName = propertyName
        self.startValue = getattr(target, propertyName)
        self.endValue = endValue
        self.duration = max(0.0001, duration)
        # Accept either a function or a string key
        if callable(easing):
            self.easing = easing
        else:
            # lookup by name, fallback to linear
            self.easing = EASINGS.get(easing, linear_easing)
        self.elapsed = 0.0
        self.finished = False
        self._callbacks = []

    def update(self, dt):
        if self.finished:
            return
        self.elapsed += dt
        progress = min(self.elapsed / self.duration, 1.0)
        factor = self.easing(progress)
        current = self.startValue + (self.endValue - self.startValue) * factor
        setattr(self.target, self.propertyName, current)
        if progress >= 1.0:
            self.finished = True
            for cb in self._callbacks:
                cb()

    def onComplete(self, callback):
        """Register a callback to run when tween finishes."""
        self._callbacks.append(callback)
        return self

    def cancel(self):
        """Stop the tween immediately."""
        self.finished = True
        return self

# --- Collision handler implementations ---

def aabbCollision(a, b):
    return (a.left < b.right and a.right > b.left
            and a.top < b.bottom and a.bottom > b.top)

def circleCircleCollision(c1, c2):
    dx = c1.x - c2.x; dy = c1.y - c2.y
    return dx*dx + dy*dy <= (c1.radius + c2.radius)**2

def circleRectCollision(circle, rect):
    cx = clamp(circle.x, rect.left, rect.right)
    cy = clamp(circle.y, rect.top, rect.bottom)
    dx = circle.x - cx; dy = circle.y - cy
    return dx*dx + dy*dy <= circle.radius**2

# --- Ellipse collision handlers ---

def ellipseEllipseCollision(e1, e2):
    dx = e1.x - e2.x; dy = e1.y - e2.y
    rx = e1.radiusX + e2.radiusX; ry = e1.radiusY + e2.radiusY
    return (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1

def ellipseRectCollision(ellipse, rect):
    cx = clamp(ellipse.x, rect.left, rect.right)
    cy = clamp(ellipse.y, rect.top, rect.bottom)
    dx = ellipse.x - cx; dy = ellipse.y - cy
    return (dx*dx)/(ellipse.radiusX**2) + (dy*dy)/(ellipse.radiusY**2) <= 1

def circleEllipseCollision(circle, ellipse):
    dx = circle.x - ellipse.x; dy = circle.y - ellipse.y
    rx = ellipse.radiusX + circle.radius; ry = ellipse.radiusY + circle.radius
    return (dx*dx)/(rx*rx) + (dy*dy)/(ry*ry) <= 1

# --- Polygon collision handlers (SAT) ---

def polygonPolygonCollision(p1, p2):
    axes = p1.getAxes() + p2.getAxes()
    for ax, ay in axes:
        min1, max1 = p1.project((ax, ay))
        min2, max2 = p2.project((ax, ay))
        if max1 < min2 or max2 < min1:
            return False
    return True

def polygonRectCollision(poly, rect):
    rect_pts = [(rect.left, rect.top), (rect.right, rect.top),
                (rect.right, rect.bottom), (rect.left, rect.bottom)]
    axes = poly.getAxes() + [(1, 0), (0, 1)]
    for ax, ay in axes:
        min1, max1 = poly.project((ax, ay))
        projs = [x*ax + y*ay for x, y in rect_pts]
        min2, max2 = min(projs), max(projs)
        if max1 < min2 or max2 < min1:
            return False
    return True

def polygonCircleCollision(poly, circle):
    axes = poly.getAxes()
    verts = poly.getVertices()
    cx, cy = circle.x, circle.y
    closest = min(verts, key=lambda v: (v[0]-cx)**2 + (v[1]-cy)**2)
    dx = closest[0] - cx; dy = closest[1] - cy
    length = math.hypot(dx, dy)
    if length > 0:
        axes.append((dx/length, dy/length))
    for ax, ay in axes:
        min1, max1 = poly.project((ax, ay))
        center_proj = cx*ax + cy*ay
        min2, max2 = center_proj - circle.radius, center_proj + circle.radius
        if max1 < min2 or max2 < min1:
            return False
    return True

def polygonEllipseCollision(poly, ellipse):
    axes = poly.getAxes()
    verts = poly.getVertices()
    for ax, ay in axes:
        # project polygon
        min1, max1 = poly.project((ax, ay))
        # project ellipse center and radius
        center_proj = ellipse.x*ax + ellipse.y*ay
        r = ellipse.radiusX*abs(ax) + ellipse.radiusY*abs(ay)
        min2, max2 = center_proj - r, center_proj + r
        if max1 < min2 or max2 < min1:
            return False
    return True

# --- Collision registry ---
COLLISION_HANDLERS = {
    ('RectangleSprite','RectangleSprite'): aabbCollision,
    ('CircleSprite','CircleSprite'):   circleCircleCollision,
    ('CircleSprite','RectangleSprite'): circleRectCollision,
    ('RectangleSprite','CircleSprite'): lambda r, c: circleRectCollision(c, r),
    ('EllipseSprite','EllipseSprite'): ellipseEllipseCollision,
    ('EllipseSprite','RectangleSprite'): ellipseRectCollision,
    ('RectangleSprite','EllipseSprite'): lambda r, e: ellipseRectCollision(e, r),
    ('CircleSprite','EllipseSprite'): circleEllipseCollision,
    ('EllipseSprite','CircleSprite'): lambda e, c: circleEllipseCollision(c, e),
    ('PolygonSprite','PolygonSprite'): polygonPolygonCollision,
    ('PolygonSprite','RectangleSprite'): polygonRectCollision,
    ('RectangleSprite','PolygonSprite'): lambda r, p: polygonRectCollision(p, r),
    ('PolygonSprite','CircleSprite'): polygonCircleCollision,
    ('CircleSprite','PolygonSprite'): lambda c, p: polygonCircleCollision(p, c),
    ('PolygonSprite','EllipseSprite'): polygonEllipseCollision,
    ('EllipseSprite','PolygonSprite'): lambda e, p: polygonEllipseCollision(p, e),
}

# --- Base class for all transformable objects ---
class Transformable:
    def __init__(self, x=0, y=0, angle=0.0, opacity=1.0, anchorX=0.5, anchorY=0.5):
        self._x = x; self._y = y; self._angle = angle
        self._opacity = None; self.opacity = opacity
        self._anchorX = clamp(anchorX, 0, 1)
        self._anchorY = clamp(anchorY, 0, 1)
        self._tweens = []
        self._hitTest = None; self._overlapTest = None

    # Tween API
    def tweenTo(self, propertyName, endValue, duration, easing=None):
        tw = Tween(self, propertyName, endValue, duration, easing)
        self._tweens.append(tw)
        return tw
    def update(self, dt):
        for tw in self._tweens[:]:
            tw.update(dt)
            if tw.finished:
                self._tweens.remove(tw)

    # Hit/Test overrides
    def setHitTest(self, fn): self._hitTest = fn
    def setOverlapTest(self, fn): self._overlapTest = fn

    def contains(self, point):
        if self._hitTest:
            return self._hitTest(self, point)
        return (point.x >= self.left and point.x <= self.right
                and point.y >= self.top and point.y <= self.bottom)

    def overlaps(self, other):
        if self._overlapTest:
            return self._overlapTest(self, other)
        key = (type(self).__name__, type(other).__name__)
        handler = COLLISION_HANDLERS.get(key)
        if handler:
            return handler(self, other)
        return aabbCollision(self, other)

    # Transform properties
    @property
    def x(self): return self._x
    @x.setter
    def x(self, v): self._x = v
    @property
    def y(self): return self._y
    @y.setter
    def y(self, v): self._y = v
    @property
    def angle(self): return self._angle
    @angle.setter
    def angle(self, v): self._angle = v
    @property
    def opacity(self): return self._opacity
    @opacity.setter
    def opacity(self, v): self._opacity = max(0.0, min(1.0, v))

    # Anchor
    @property
    def anchorX(self): return self._anchorX
    @anchorX.setter
    def anchorX(self, v): self._anchorX = clamp(v, 0, 1)
    @property
    def anchorY(self): return self._anchorY
    @anchorY.setter
    def anchorY(self, v): self._anchorY = clamp(v, 0, 1)
    def setAnchor(self, ax, ay): self.anchorX, self.anchorY = ax, ay

    # Movement
    def moveBy(self, dx, dy): self.x += dx; self.y += dy
    def moveTo(self, x, y): self.x = x; self.y = y
    def rotateTo(self, angle): self.angle = angle
    def rotateBy(self, d): self.angle += d

    # Boundaries
    @property
    def left(self): return self.x
    @property
    def right(self): return self.x + self.width
    @property
    def top(self): return self.y
    @property
    def bottom(self): return self.y + self.height

    # Drawing (render only)
    def draw(self):
        saveState()
        if self.angle != 0.0:
            px = getattr(self, 'width', 0) * self.anchorX
            py = getattr(self, 'height',0) * self.anchorY
            translate(self.x + px, self.y + py)
            rotate(self.angle)
            translate(-px, -py)
        else:
            translate(self.x, self.y)
        self._render()
        restoreState()

# --- Image sprite ---
class Sprite(Transformable):
    """Image-based sprite (alias for backwards compatibility)"""
    def __init__(self, imageSource, x=0, y=0, width=None, height=None):
        super().__init__(x, y)
        self._imageFile = None
        self._image = None
        # Accept either a filename (str) or an already-loaded image object
        if isinstance(imageSource, str):
            self.imageFile = imageSource
            img = self._image
        else:
            img = imageSource
            self._image = img
            # try to preserve original file name if available
            self._imageFile = getattr(img, 'file', None)
        # Set dimensions
        self.width = width if width is not None else getattr(img, 'width', 0)
        self.height = height if height is not None else getattr(img, 'height', 0)

    @property
    def imageFile(self):
        return self._imageFile

    @imageFile.setter
    def imageFile(self, f):
        self._imageFile = f
        self._image = loadImage(f)

    @property
    def image(self):
        return self._image

    @image.setter
    def image(self, img):
        """Allow assigning a loaded image directly."""
        self._image = img
        # update size defaults if available
        try:
            self.width = img.width
            self.height = img.height
        except AttributeError:
            pass

    @property
    def width(self):
        return self._width

    @width.setter
    def width(self, v):
        self._width = max(0, v)

    @property
    def height(self):
        return self._height

    @height.setter
    def height(self, v):
        self._height = max(0, v)

    def _render(self):
        drawImage(self._image, 0, 0, self.width, self.height, opacity=self.opacity)

    def __repr__(self):
        return (f"Sprite(imageFile='{self.imageFile}', x={self.x}, y={self.y}, "
                f"width={self.width}, height={self.height}, opacity={self.opacity}, "
                f"angle={self.angle}, anchor=({self.anchorX},{self.anchorY}))")

# --- Text sprite ---
class TextSprite(Transformable):
    """Text-based sprite"""
    def __init__(self, textContent, x=0, y=0, fontSize=20, fontName="Arial"):
        super().__init__(x, y)
        self._textContent = textContent
        self._fontSize = fontSize
        self._fontName = fontName
        self._fillR = 255; self._fillG = 255; self._fillB = 255
        self._recalculate_metrics()

    def _recalculate_metrics(self):
        metrics = measureText(self._textContent, self._fontSize, self._fontName)
        self.width = metrics["actualBoundingBoxLeft"] + metrics["actualBoundingBoxRight"]
        self.height = metrics["actualBoundingBoxAscent"] + metrics["actualBoundingBoxDescent"]

    @property
    def textContent(self): return self._textContent

    @textContent.setter
    def textContent(self, v):
        self._textContent = v
        self._recalculate_metrics()

    @property
    def fontSize(self): return self._fontSize

    @fontSize.setter
    def fontSize(self, v):
        self._fontSize = v
        self._recalculate_metrics()

    @property
    def fontName(self): return self._fontName

    @fontName.setter
    def fontName(self, v):
        self._fontName = v
        self._recalculate_metrics()

    def setColour(self, r, g, b, a=None):
        """Set fill colour (and optional opacity) for text"""
        self._fillR = clamp(r, 0, 255)
        self._fillG = clamp(g, 0, 255)
        self._fillB = clamp(b, 0, 255)
        if a is not None:
            self.opacity = a

    def _render(self):
        fill(self._fillR, self._fillG, self._fillB, self.opacity)
        text(self._textContent, 0, 0, self._fontSize, self._fontName)

    def __repr__(self):
        return (f"TextSprite(text='{self._textContent}', x={self.x}, y={self.y}, "
                f"fontSize={self._fontSize}, fontName='{self._fontName}', "
                f"fill=({self._fillR},{self._fillG},{self._fillB},{self.opacity}))")

    def __str__(self):
        return (f"TextSprite - '{self._textContent}' at ({self.x},{self.y}), "
                f"size=({self.width},{self.height}), font={self.fontName} {self.fontSize}, "
                f"fill=({self._fillR},{self._fillG},{self._fillB},{self.opacity})")

# --- Base for fillable and stroking shapes ---
class ShapeSprite(Transformable):
    def __init__(self, x=0, y=0):
        super().__init__(x, y)
        self._fillR = 255; self._fillG = 255; self._fillB = 255
        self._strokeEnabled = False
        self._strokeR = 0; self._strokeG = 0; self._strokeB = 0; self._strokeA = 1.0
        self._strokeWeight = 1

    def setColour(self, r, g, b, a=None):
        self._fillR = clamp(r, 0, 255)
        self._fillG = clamp(g, 0, 255)
        self._fillB = clamp(b, 0, 255)
        if a is not None: self.opacity = a

    def setStroke(self, r, g, b, a=None):
        self._strokeEnabled = True
        self._strokeR = clamp(r,0,255)
        self._strokeG = clamp(g,0,255)
        self._strokeB = clamp(b,0,255)
        if a is not None: self._strokeA = clamp(a, 0.0, 1.0)

    def strokeWeight(self, w): self._strokeWeight = max(0, w)
    def noStroke(self): self._strokeEnabled = False

    @property
    def fillR(self): return self._fillR
    @property
    def fillG(self): return self._fillG
    @property
    def fillB(self): return self._fillB
    @property
    def strokeR(self): return self._strokeR
    @strokeR.setter
    def strokeR(self, v): self._strokeR = clamp(v,0,255)
    @property
    def strokeG(self): return self._strokeG
    @strokeG.setter
    def strokeG(self, v): self._strokeG = clamp(v,0,255)
    @property
    def strokeB(self): return self._strokeB
    @strokeB.setter
    def strokeB(self, v): self._strokeB = clamp(v,0,255)
    @property
    def strokeA(self): return self._strokeA
    @strokeA.setter
    def strokeA(self, v): self._strokeA = clamp(v,0.0,1.0)
    @property
    def strokeWeightValue(self): return self._strokeWeight

    def _render(self):
        fill(self._fillR, self._fillG, self._fillB, self.opacity)
        if self._strokeEnabled:
            stroke(self._strokeR, self._strokeG, self._strokeB, self._strokeA)
            strokeWeight(self._strokeWeight)
        else:
            noStroke()
        self._renderShape()

# --- Specific shape classes ---
class RectangleSprite(ShapeSprite):
    def __init__(self, x=0, y=0, width=0, height=0):
        super().__init__(x, y)
        self.width, self.height = width, height
    def _renderShape(self): rect(0, 0, self.width, self.height)
    def __repr__(self): return f"RectangleSprite(x={self.x},y={self.y},w={self.width},h={self.height})"

class CircleSprite(ShapeSprite):
    def __init__(self, x=0, y=0, radius=0):
        super().__init__(x, y)
        self.radius = radius
    @property
    def left(self): return self.x - self.radius
    @property
    def right(self): return self.x + self.radius
    @property
    def top(self): return self.y - self.radius
    @property
    def bottom(self): return self.y + self.radius
    def _renderShape(self): circle(0, 0, self.radius)
    def __repr__(self): return f"CircleSprite(x={self.x},y={self.y},r={self.radius})"

class EllipseSprite(ShapeSprite):
    def __init__(self, x=0, y=0, radiusX=0, radiusY=0):
        super().__init__(x, y)
        self.radiusX, self.radiusY = radiusX, radiusY
    @property
    def left(self): return self.x - self.radiusX
    @property
    def right(self): return self.x + self.radiusX
    @property
    def top(self): return self.y - self.radiusY
    @property
    def bottom(self): return self.y + self.radiusY
    def _renderShape(self): ellipse(0, 0, self.radiusX, self.radiusY)
    def __repr__(self): return f"EllipseSprite(x={self.x},y={self.y},rx={self.radiusX},ry={self.radiusY})"

class PolygonSprite(ShapeSprite):
    """Convex polygon sprite defined by number of sides and radius."""
    def __init__(self, x=0, y=0, numSides=3, radius=0):
        super().__init__(x, y)
        self.numSides = max(3, int(numSides))
        self.radius = max(0, radius)
    def _renderShape(self):
        beginShape()
        for i in range(self.numSides):
            ang = 2*math.pi*i/self.numSides
            vertex(self.radius*math.cos(ang), self.radius*math.sin(ang))
        endShape()
    def getVertices(self):
        verts=[]
        for i in range(self.numSides):
            ang = 2*math.pi*i/self.numSides + self.angle
            verts.append((self.x+ self.radius*math.cos(ang), self.y+ self.radius*math.sin(ang)))
        return verts
    def getAxes(self):
        verts = self.getVertices()
        axes=[]
        for i in range(len(verts)):
            x1,y1=verts[i]; x2,y2=verts[(i+1)%len(verts)]
            dx,dy=x2-x1,y2-y1; nx,ny= -dy,dx
            mag=math.hypot(nx,ny)
            axes.append((nx/mag,ny/mag))
        return axes
    def project(self, axis):
        projs=[v[0]*axis[0]+v[1]*axis[1] for v in self.getVertices()]
        return (min(projs), max(projs))
    def __repr__(self):
        return f"PolygonSprite(x={self.x},y={self.y},sides={self.numSides},r={self.radius})"
    def __str__(self):
        return f"PolygonSprite - sides:{self.numSides}, radius:{self.radius}, pos:({self.x},{self.y}), angle:{self.angle}"
