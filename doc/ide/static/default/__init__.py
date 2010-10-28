import webgl
import webgl.primitives
import webgl.models

def main():
    print "Starting up..."
    gl = webgl.Context("canvas")
    sh = webgl.Shader(gl, VertexShader, FragmentShader)
    sh.use()
    
    m = webgl.models.Model(sh, webgl.primitives.createCube(1), [])

    def draw(gl, time):
        print "wee", time
        #m.drawPrep()
        #m.draw()

    gl.setDrawFunc(draw)

VertexShader = """
uniform mat4 u_worldviewproj;

attribute vec3 position;

void main()
{
    gl_Position = u_worldviewproj * vec4(position, 1);
}
"""
 
FragmentShader = """
#ifdef GL_ES
    precision mediump float;
#endif
void main()
{
    gl_FragColor = vec4(1, 0, 0, 1);
}
"""
main()
