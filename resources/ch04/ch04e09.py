from gasp import *

begin_graphics()

Box((20, 20), 100, 100)
Box((55, 20), 30, 50)
Box((40, 80), 20, 20)
Box((80, 80), 20, 20)
Line((20, 120), (70, 160))
Line((70, 160), (120, 120))

update_when('key_pressed')
end_graphics()
