import webgl

def main():
    print "Starting up..."
    gl = webgl.Context("canvas")

    def draw(gl, time):
        """gl is the context in case the draw function isn't nested, time is the number of milliseconds
        since setDrawFunc was first called."""

        gl.clearColor(0,0,0,1)
        gl.clear(gl.COLOR_BUFFER_BIT)
        gl.flush()

    gl.setDrawFunc(draw)

main()
