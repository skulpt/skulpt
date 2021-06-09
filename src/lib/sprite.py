class Point():
    def __init__(self, x = 0, y = 0):
        self.x = x
        self.y = y

class Colour():
    def __init__(self, r = 255, g = 255, b = 255, a = 1.0):
        self.r = r
        self.g = g
        self.b = b
        self.a = a

def getPixelColour(x, y):
    pixel = _getPixelColour(x, y)
    return Colour(pixel["0"], pixel["1"], pixel["2"], pixel["3"])

class Sprite:
    def __init__(self, image, x = 0, y = 0, width = 0, height = 0, opacity = 1.0):
        self.x = x
        self.y = y
        self.opacity = opacity
        self.image = loadImage(image)
        if width == 0:
            self.width = _getImageWidth(self.image)
        else:
            self.width = width
        if height == 0:
            self.height = _getImageHeight(self.image)
        else:
            self.height = height

    def draw(self, offsetX = 0, offsetY = 0):
        image(self.image, self.x - offsetX, self.y - offsetY, self.width, self.height, opacity=self.opacity)

    def moveBy(self, x, y):
        self.x += x
        self.y += y

    def moveTo(self, x, y):
        self.x = x
        self.y = y

    def leftBoundary(self):
        return self.x

    def rightBoundary(self):
        return self.x + self.width

    def topBoundary(self):
        return self.y

    def bottomBoundary(self):
        return self.y + self.height

    def overlaps(self, other):
        return self.leftBoundary() < other.rightBoundary() and self.rightBoundary() > other.leftBoundary() and self.topBoundary() < other.bottomBoundary() and self.bottomBoundary() > other.topBoundary()

    def contains(self, point):
        return point.x >= self.leftBoundary() and point.x <= self.rightBoundary() and point.y >= self.topBoundary() and point.y <= self.bottomBoundary()

class TextSprite(Sprite):
    def __init__(self, text, x = 0, y = 0, fontSize = 20, fontName = "Arial", r = 255, g = 255, b = 255, a = 1.0):
        self.text = text
        self.x = x
        self.y = y
        self.fontSize = fontSize
        self.fontName = fontName
        self.setColour(r, g, b)
        # Get Text Width
        f = _getFont()
        _setFont(str(self.fontSize) + "px " + self.fontName)
        textMetrics = _measureText(self.text)
        self.width = abs(textMetrics["actualBoundingBoxLeft"]) + abs(textMetrics["actualBoundingBoxRight"])
        self.height = abs(textMetrics["actualBoundingBoxAscent"]) + abs(textMetrics["actualBoundingBoxDescent"])
        _setFont(f)

    def center(self):
        self.x -= (self.width/2)
        self.y -= (self.height/2)

    def draw(self):
        fs = _getFillStyle()
        _setFillStyle("rgba(" + str(self.r) + "," + str(self.g) + "," + str(self.b) + "," + str(self.a)+ ")")
        text(self.text, self.x, self.y, self.fontSize, self.fontName)
        _setFillStyle(fs)

    def setColour(self, r, g, b, a = 1.0):
        self.r = r
        self.g = g
        self.b = b
        self.a = a

class RectangleSprite(TextSprite):
    def __init__(self, x, y, width, height, r = 255, b = 255, g = 255, a = 1.0):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.setColour(r, g, b)
        self.strokeWeight(1)
        self.stroke(0, 0, 0, 1)
        self.noStroke()

    def noStroke(self):
        self._doStroke = False

    def stroke(self, r, g, b, a = 1):
        self.stroke_r = r
        self.stroke_g = g
        self.stroke_b = b
        self.stroke_a = a
        self._doStroke = True

    def strokeWeight(self, weight):
        self._strokeWeight = weight

    def draw(self):
        fs = _getFillStyle()
        _setFillStyle("rgba(" + str(self.r) + "," + str(self.g) + "," + str(self.b) + "," + str(self.a)+ ")")
        ss = _getStrokeStyle()
        lw = _getLineWidth()
        _setLineWidth(self._strokeWeight)
        _setStrokeStyle("rgba(" + str(self.stroke_r) + "," + str(self.stroke_g) + "," + str(self.stroke_b) + "," + str(self.stroke_a)+ ")")
        ds = _getDoStroke()
        _setDoStroke(self._doStroke)

        self.drawShape()

        _setFillStyle(fs)
        _setStrokeStyle(ss)
        _setLineWidth(lw)
        _setDoStroke(ds)

    def drawShape(self):
        rect(self.x, self.y, self.width, self.height)

class CircleSprite(RectangleSprite):
    def __init__(self, x, y, radius, r = 255, b = 255, g = 255, a = 1.0):
        self.x = x
        self.y = y
        self.radius = radius
        self.diameter = radius * 2
        self.setColour(r, g, b, a)
        self.strokeWeight(1)
        self.stroke(0, 0, 0, 1)
        self.noStroke()

    def leftBoundary(self):
        return self.x - self.radius

    def rightBoundary(self):
        return self.x + self.radius

    def topBoundary(self):
        return self.y - self.radius

    def bottomBoundary(self):
        return self.y + self.radius

    def drawShape(self):
        circle(self.x, self.y, self.radius)

class EllipseSprite(RectangleSprite):
    def __init__(self, x, y, radiusX, radiusY, r = 255, b = 255, g = 255, a = 1.0):
        self.x = x
        self.y = y
        self.radiusX = radiusX
        self.radiusY = radiusY
        self.setColour(r, g, b, a)
        self.strokeWeight(1)
        self.stroke(0, 0, 0, 1)
        self.noStroke()

    def leftBoundary(self):
        return self.x - self.radiusX

    def rightBoundary(self):
        return self.x + self.radiusX

    def topBoundary(self):
        return self.y - self.radiusY

    def bottomBoundary(self):
        return self.y + self.radiusY

    def drawShape(self):
        ellipse(self.x, self.y, self.radiusX, self.radiusY)
