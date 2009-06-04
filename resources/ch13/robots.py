from gasp import *

SCREEN_WIDTH = 640
SCREEN_HEIGHT = 480
GRID_WIDTH = SCREEN_WIDTH/10 - 1
GRID_HEIGHT = SCREEN_HEIGHT/10 - 1


def place_player():
    return [50, 240]


def move_player(player):
    while True:
        message = Text("Have you had enough yet (y/n)? ",
                       tuple(player),
                       size=24)
        update_when('key_pressed')
        remove_from_screen(message)
        player[0] = player[0] % 600 + 10
        if key_pressed('y'):
            return True
        return False


def play_game():
    begin_graphics(SCREEN_WIDTH, SCREEN_HEIGHT)
    player = place_player()
    finished = False
    while not finished:
        finished = move_player(player)
    end_graphics()


if __name__ == '__main__':
    play_game()
