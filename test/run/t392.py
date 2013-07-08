# Ship class
class Ship:
    def __init__(self, name):
        self.name = name
        self.thrust = False

    def thrust(self):
          self.thrust = True
          print "Thrust", self.thrust

my_ship = Ship("a_name")
my_ship.thrust()
