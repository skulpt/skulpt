class Sprite:
    def __init__(self, image, x = 0, y = 0, width = 0, height = 0, opacity = 1.0):
        self.x = x
        self.y = y
        self.opacity = opacity
        self.image = loadImage(image)
        if width == 0:
            self.width = self.image.width
        else:
            self.width = width
        if height == 0:
            self.height = self.image.height
        else:
            self.height = height

    def __repr__(self):
        return f"Sprite(\"{self.image.file}\", {self.x}, {self.y}, {self.width}, {self.height}, {self.opacity})"

    def __str__(self):
        return f"Sprite Object - image: {self.image.file}, x: {self.x}, y: {self.y}, width: {self.width}, height: {self.height}, opacity: {self.opacity}"

    def draw(self, offsetX = 0, offsetY = 0):
        drawImage(self.image, self.x - offsetX, self.y - offsetY, self.width, self.height, opacity=self.opacity)

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
        textMetrics = measureText(self.text, self.fontSize, self.fontName)
        self.width = abs(textMetrics["actualBoundingBoxLeft"]) + abs(textMetrics["actualBoundingBoxRight"])
        self.height = abs(textMetrics["actualBoundingBoxAscent"]) + abs(textMetrics["actualBoundingBoxDescent"])

    def __repr__(self):
        return f"TextSprite({self.text}, {self.x}, {self.y}, {self.fontSize}, {self.fontName}, {self.r}, {self.g}, {self.b}, {self.a})"

    def __str__(self):
        return f"TextSprite Object - text: {self.text}, x: {self.x}, y: {self.y}, fontSize: {self.fontSize}, fontName: {self.fontName}, r: {self.r}, g: {self.g}, b: {self.b}, a: {self.a}"

    def center(self):
        self.x -= (self.width/2)
        self.y -= (self.height/2)

    def draw(self):
        saveState()
        fill(self.r, self.g, self.b, self.a)
        text(self.text, self.x, self.y, self.fontSize, self.fontName)
        restoreState()

    def setColour(self, r, g, b, a = 1.0):
        self.r = r
        self.g = g
        self.b = b
        self.a = a

class RectangleSprite(TextSprite):
    def __init__(self, x, y, width, height, r = 255, g = 255, b = 255, a = 1.0):
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.setColour(r, g, b)
        self.strokeWeight(1)
        self.stroke(0, 0, 0, 1)
        self.noStroke()

    def __repr__(self):
        return f"RectangleSprite({self.x}, {self.y}, {self.width}, {self.height}, {self.r}, {self.g}, {self.b}, {self.a})"

    def __str__(self):
        return f"RectangleSprite Object - x: {self.x}, y: {self.y}, width: {self.width}, height: {self.height}, r: {self.r}, g: {self.g}, b: {self.b}, a: {self.a}"

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
        saveState()
        fill(self.r, self.g, self.b, self.a)
        strokeWeight(self._strokeWeight)
        if self._doStroke:
            stroke(self.stroke_r, self.stroke_g, self.stroke_b, self.stroke_a)
        else:
            noStroke()
        self.drawShape()
        restoreState()

    def drawShape(self):
        rect(self.x, self.y, self.width, self.height)

class CircleSprite(RectangleSprite):
    def __init__(self, x, y, radius, r = 255, g = 255, b = 255, a = 1.0):
        self.x = x
        self.y = y
        self.radius = radius
        self.diameter = radius * 2
        self.setColour(r, g, b, a)
        self.strokeWeight(1)
        self.stroke(0, 0, 0, 1)
        self.noStroke()

    def __repr__(self):
        return f"CircleSprite({self.x}, {self.y}, {self.radius}, {self.r}, {self.g}, {self.b}, {self.a})"

    def __str__(self):
        return f"CircleSprite Object - x: {self.x}, y: {self.y}, radius: {self.radius}, r: {self.r}, g: {self.g}, b: {self.b}, a: {self.a}"

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
    def __init__(self, x, y, radiusX, radiusY, r = 255, g = 255, b = 255, a = 1.0):
        self.x = x
        self.y = y
        self.radiusX = radiusX
        self.radiusY = radiusY
        self.setColour(r, g, b, a)
        self.strokeWeight(1)
        self.stroke(0, 0, 0, 1)
        self.noStroke()

    def __repr__(self):
        return f"EllipseSprite({self.x}, {self.y}, {self.radiusX}, {self.radiusY}, {self.r}, {self.g}, {self.b}, {self.a})"

    def __str__(self):
        return f"EllipseSprite Object - x: {self.x}, y: {self.y}, radiusX: {self.radiusX}, radiusY: {self.radiusY}, r: {self.r}, g: {self.g}, b: {self.b}, a: {self.a}"

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
