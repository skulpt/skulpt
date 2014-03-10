import numpy as np
from controller import Controller
from drone import Drone
from simulator import Simulator

def run():
    drone = Drone()
    controller = Controller(drone)
    simulator=Simulator(drone,controller)
    deviation = 1;   # Simulate some disturbance in the angular velocity.
    #angular_disturbance=simulator.deg2rad(2 * deviation * np.random(3, 1) - deviation).transpose()
    angular_disturbance = np.array([[0.003], [0.002], [0.01]])
    drone.thetadot = angular_disturbance  # Simulate some disturbance in the angular velocity.
    simulator = Simulator(drone, controller)
    simulator.simulate(1)  # simulate n secs
    
run()