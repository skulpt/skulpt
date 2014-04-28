from simulator.controller import RelativeOrder

def forward(distance):
    return RelativeOrder(distance, 0, 0, 0)

def backward(distance):
    return RelativeOrder(-distance, 0, 0, 0)

def left(distance):
    return RelativeOrder(0, distance, 0, 0)

def right(distance):
    return RelativeOrder(0, -distance, 0, 0)

def up(distance):
    return RelativeOrder(0, 0, distance, 0)

def down(distance):
    return RelativeOrder(0, 0, -distance, 0)

def turn_left(angle):
    return RelativeOrder(0, 0, 0, angle)

def turn_right(angle):
    return RelativeOrder(0, 0, 0, -angle)
