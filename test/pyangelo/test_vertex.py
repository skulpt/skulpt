import unittest

class VertexTestCase(unittest.TestCase):

    def test_vertex_close(self):
        setCanvasSize(400, 400, JAVASCRIPT)
        bgColour = 200
        background(bgColour, bgColour, bgColour)
        fillColour = 99
        fill(fillColour, fillColour, fillColour)
        strokeWeight(10)
        strokeColour = 50
        stroke(strokeColour, strokeColour, strokeColour)
        beginShape()
        vertex(10, 10)
        vertex(20, 100)
        vertex(60, 110)
        vertex(50, 50)
        vertex(200, 10)
        endShape()

        c = getPixelColour(20, 20)
        self.assertEqual(c.red, fillColour)
        self.assertEqual(c.green, fillColour)
        self.assertEqual(c.blue, fillColour)

        c = getPixelColour(100, 10)
        self.assertEqual(c.red, strokeColour)
        self.assertEqual(c.green, strokeColour)
        self.assertEqual(c.blue, strokeColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_vertex_open(self):
        setCanvasSize(400, 400, JAVASCRIPT)
        bgColour = 200
        background(bgColour, bgColour, bgColour)
        fillColour = 99
        fill(fillColour, fillColour, fillColour)
        strokeWeight(10)
        strokeColour = 50
        stroke(strokeColour, strokeColour, strokeColour)
        beginShape()
        vertex(10, 10)
        vertex(20, 100)
        vertex(60, 110)
        vertex(50, 50)
        vertex(200, 10)
        endShape(OPEN)

        c = getPixelColour(20, 20)
        self.assertEqual(c.red, fillColour)
        self.assertEqual(c.green, fillColour)
        self.assertEqual(c.blue, fillColour)

        c = getPixelColour(100, 10)
        self.assertEqual(c.red, fillColour)
        self.assertEqual(c.green, fillColour)
        self.assertEqual(c.blue, fillColour)

        c = getPixelColour(10, 10)
        self.assertEqual(c.red, strokeColour)
        self.assertEqual(c.green, strokeColour)
        self.assertEqual(c.blue, strokeColour)

        c = getPixelColour(5, 5)
        self.assertEqual(c.red, bgColour)
        self.assertEqual(c.green, bgColour)
        self.assertEqual(c.blue, bgColour)

    def test_vertexParameterTypes(self):
        with self.assertRaises(TypeError):
            beginShape("Hello")
        with self.assertRaises(TypeError):
            endShape("Hello")
        with self.assertRaises(TypeError):
            vertex(1)
        with self.assertRaises(TypeError):
            vertex(1, 2, 3)
        with self.assertRaises(TypeError):
            vertex("Hello", 2)
        with self.assertRaises(TypeError):
            vertex(1, "Hello")

if __name__ == "__main__":
    unittest.main()
