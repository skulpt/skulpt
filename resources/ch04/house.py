from gasp import *

def draw_house(x, y):
    Box((x, y), 100, 100)
    Box((x + 35, y), 30, 50)
    Box((x + 20, y + 60), 20, 20)
    Box((x + 60, y + 60), 20, 20)
    Line((x, y + 100), (x + 50, y + 140))
    Line((x + 50, y + 140), (x + 100, y + 100))

begin_graphics()
draw_house(20, 20)
draw_house(130, 130)
draw_house(240, 240)
draw_house(350, 240)
draw_house(460, 240)
update_when('key_pressed')
end_graphics()
