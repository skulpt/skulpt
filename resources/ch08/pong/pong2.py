from gasp import *

COMPUTER_WINS = 1
PLAYER_WINS = 0
QUIT = -1


def hit(bx, by, r, px, py, h):
    return py <= by <= py + h and abs(bx - px) <= r


def play_round():
    ball_x = 10
    ball_y = random_between(20, 280)
    ball = Circle((ball_x, ball_y), 10, filled=True)
    dx = 4
    dy = random_between(-5, 5) 

    paddle_x = 780
    paddle_y = random_between(0, 500)
    paddle = Box((paddle_x, paddle_y), 10, 100, filled=True)

    while True:
        if ball_y >= 590 or ball_y <= 10:
            dy *= -1
        ball_x += dx
        ball_y += dy
        if ball_x >= 810:
            remove_from_screen(ball)
            remove_from_screen(paddle)
            return COMPUTER_WINS 
        elif ball_x <= 0:
            remove_from_screen(ball)
            remove_from_screen(paddle)
            return PLAYER_WINS
        move_to(ball, (ball_x, ball_y))

        # check for key pressed event and move paddle appropriately
        if key_pressed('k') and paddle_y <= 500:
            paddle_y += 5
        elif key_pressed('j') and paddle_y >= 0:
            paddle_y -= 5
        elif key_pressed('escape'):
            return QUIT
        move_to(paddle, (paddle_x, paddle_y))

        if hit(ball_x, ball_y, 10, paddle_x, paddle_y, 100):
            dx *= -1

        update_when('next_tick')


def play_game():
    player_score = 0
    comp_score = 0

    while True:
        pmsg = Text("Player: %d Points" % player_score, (10, 570), size=24)
        cmsg = Text("Computer: %d Points" % comp_score, (640, 570), size=24)
        sleep(4)
        remove_from_screen(pmsg)
        remove_from_screen(cmsg)

        result = play_round()

        if result == PLAYER_WINS:
            player_score += 1
        elif result == COMPUTER_WINS:
            comp_score += 1
        else:
            return QUIT 

        if player_score == 5:
            return PLAYER_WINS
        elif comp_score == 5:
            return COMPUTER_WINS 


begin_graphics(800, 600, title="Catch", background=color.YELLOW)
set_speed(120)

result = play_game()

if result == PLAYER_WINS:
    Text("Player Wins!", (340, 290), size=32)
elif result == COMPUTER_WINS:
    Text("Computer Wins!", (340, 290), size=32)

sleep(4)

end_graphics()
