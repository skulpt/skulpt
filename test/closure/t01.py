import goog.graphics as gfx
import goog.dom as dom

def main():
    g = gfx.createSimpleGraphics(600, 200)
    print g
    fill = gfx.SolidFill('yellow')
    stroke = gfx.Stroke(2, 'green')

    g.drawRect(30, 10, 100, 80, stroke, fill)
    stroke = gfx.Stroke(4, 'green')

    g.drawImage(30, 110, 276, 110, 'http://www.google.com/intl/en_ALL/images/logo.gif')

    g.drawCircle(190, 70, 50, stroke, fill)

    stroke = gfx.Stroke(6, 'green')
    g.drawEllipse(300, 140, 80, 40, stroke, fill)

    # A path
    path = gfx.Path()
    path.moveTo(320, 30)
    path.lineTo(420, 130)
    path.lineTo(480, 30)
    path.close()
    stroke = gfx.Stroke(1, 'green')
    g.drawPath(path, stroke, fill)

    # Clipped shapes
    redFill = gfx.SolidFill('red')
    g.drawCircle(540, 10, 50, None, redFill);
    g.drawCircle(540, 10, 30, None, fill);
    g.drawCircle(560, 210, 30, stroke, fill);
    g.drawCircle(560, 210, 45, stroke, None); # no fill
    g.drawCircle(600, 90, 30, stroke, fill);

    g.render(dom.getElement('canv'))
 
main()
