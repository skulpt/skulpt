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
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)
        self.assertEqual(c.b, fillColour)

        c = getPixelColour(100, 10)
        self.assertEqual(c.r, strokeColour)
        self.assertEqual(c.g, strokeColour)
        self.assertEqual(c.b, strokeColour)

        c = getPixelColour(0, 0)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

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
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)
        self.assertEqual(c.b, fillColour)

        c = getPixelColour(100, 10)
        self.assertEqual(c.r, fillColour)
        self.assertEqual(c.g, fillColour)
        self.assertEqual(c.b, fillColour)

        c = getPixelColour(10, 10)
        self.assertEqual(c.r, strokeColour)
        self.assertEqual(c.g, strokeColour)
        self.assertEqual(c.b, strokeColour)

        c = getPixelColour(5, 5)
        self.assertEqual(c.r, bgColour)
        self.assertEqual(c.g, bgColour)
        self.assertEqual(c.b, bgColour)

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
