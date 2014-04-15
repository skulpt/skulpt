import numpy as np
from controller import Controller
from drone import Drone
from simulator import Simulator

def run():
    drone = Drone()
    controller = Controller(drone)
    simulator = Simulator(drone, controller)
    deviation = 1;   # Simulate some disturbance in the angular velocity.
    #angular_disturbance=simulator.deg2rad(2 * deviation * np.random.rand(3, 1) - deviation).transpose()
    angular_disturbance = np.array([[0.0],[0.1],[0.0]])
    #drone.thetadot = angular_disturbance  # Simulate some disturbance in the angular velocity.
    simulator.simulate(60)  # simulate n secs
    
    import matplotlib.pyplot
    matplotlib.pyplot.pause(60)
run()