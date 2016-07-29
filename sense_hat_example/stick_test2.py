from sense_hat import SenseHat
from time import sleep

sense = SenseHat()


while True:
    event = sense.stick.wait_for_event()
    print("Test1: The joystick was {} {}".format(event.action, event.direction))
    
    if event.direction == "up":
        break
    #sleep(0.1)

sense = SenseHat()
while True:
    for event in sense.stick.get_events():
        print("Test2: The joystick was {} {}".format(event.action, event.direction))

#event = sense.stick.wait_for_event(emptybuffer=True)
#print("The joystick was {} {}".format(event.action, event.direction))