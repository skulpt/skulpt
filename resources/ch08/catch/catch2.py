from gasp import *

def distance((x1, y1), (x2, y2)):
        return ((x2 - x1)**2 + (y2 - y1)**2)**0.5

begin_graphics(800, 600, title="Catch", background=color.YELLOW)
set_speed(120)

ball_x = 10
ball_y = 300
ball = Circle((ball_x, ball_y), 10, filled=True)
dx = 4
dy = random_between(-4, 4) 

mitt_x = 780
mitt_y = 300
mitt = Circle((mitt_x, mitt_y), 20)

while True:
    if ball_y >= 590 or ball_y <= 10:
        dy *= -1
    ball_x += dx
    ball_y += dy
    if ball_x >= 810:
        Text("Computer Wins!", (340, 290), size=32)
        sleep(2)
        break
    move_to(ball, (ball_x, ball_y))

    if key_pressed('j') and mitt_y <= 580:
        mitt_y += 5
    elif key_pressed('k') and mitt_y >= 20:
        mitt_y -= 5
    elif key_pressed('escape'):
        break
    move_to(mitt, (mitt_x, mitt_y))

    if distance((ball_x, ball_y), (mitt_x, mitt_y)) <= 30:
        remove_from_screen(ball)
        Text("Player Wins!", (340, 290), size=32)
        sleep(2)
        break

    update_when('next_tick')

end_graphics()
