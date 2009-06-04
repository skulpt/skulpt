from gasp import *

PLAYER1_WINS = 1
PLAYER2_WINS = -1
QUIT = 0 


def hit(bx, by, r, px, py, h):
    return py <= by <= py + h and abs(px - bx) <= r


def play_round():
    bx = 400
    by = 300 
    ball = Circle((bx, by), 10, filled=True)
    dx = 4 * (-1)**random_between(0, 1)
    dy = random_between(1, 5) * (-1)**random_between(0, 1) 

    p1x = 780
    p1y = 250
    p1 = Box((p1x, p1y), 10, 100, filled=True)

    p2x = 20
    p2y = 250
    p2 = Box((p2x, p2y), 10, 100, filled=True)

    while True:
        if by >= 590 or by <= 10:
            dy *= -1
        bx += dx
        by += dy
        if bx <= -10 or bx >= 810:
            remove_from_screen(ball)
            remove_from_screen(p1)
            remove_from_screen(p2)
            if bx <= -10:
                return PLAYER1_WINS 
            else:
                return PLAYER2_WINS
        move_to(ball, (bx, by))

        # check for key pressed event and move p1 and p2 appropriately
        if key_pressed('k') and p1y <= 500:
            p1y += 5
        elif key_pressed('j') and p1y >= 0:
            p1y -= 5
        if key_pressed('s') and p2y <= 500:
            p2y += 5
        elif key_pressed('a') and p2y >= 0:
            p2y -= 5
        if key_pressed('escape'):
            return QUIT
        move_to(p1, (p1x, p1y))
        move_to(p2, (p2x, p2y))

        if hit(bx, by, 10, p1x, p1y, 100) or hit(bx, by, 10, p2x+10, p2y, 100):
            dx *= -1

        update_when('next_tick')


def play_game():
    p1_score = 0
    p2_score = 0

    while True:
        pmsg = Text("%d" % p1_score, (20, 570), size=24)
        cmsg = Text("%d" % p2_score, (760, 570), size=24)
        sleep(3)
        remove_from_screen(pmsg)
        remove_from_screen(cmsg)

        result = play_round()

        if result == PLAYER1_WINS:
            p1_score += 1
        elif result == PLAYER2_WINS:
            p2_score += 1
        else:
            return QUIT 

        if p1_score == 5:
            return PLAYER1_WINS
        elif p2_score == 5:
            return PLAYER2_WINS 


begin_graphics(800, 600, title="Catch", background=color.YELLOW)
set_speed(120)

result = play_game()

if result == PLAYER1_WINS:
    Text("Player 1 Wins!", (340, 290), size=32)
elif result == PLAYER2_WINS:
    Text("Player 2 Wins!", (340, 290), size=32)

sleep(4)

end_graphics()
