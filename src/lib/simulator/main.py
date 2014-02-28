'''
Created on 08.02.2014

@author: tatsch
'''

import math
import numpy as np
from drone import Drone
from controller import Controller
from simulator import Simulator

if __name__ == '__main__':

    def deg2rad(degrees):
        return np.asarray(map(math.radians, degrees))

    drone = Drone()
    controller = Controller(drone)
    # Simulate some disturbance in the angular velocity.
    deviation = 1;  #
    # angular_disturbance=deg2rad(2 * deviation * np.random.random((3, 1)) - deviation).transpose()
    angular_disturbance = np.array([[0.003], [0.002], [0.01]])
    drone.thetadot = angular_disturbance  # Simulate some disturbance in the angular velocity.
    simulator = Simulator(drone, controller)
    simulator.simulate(30)  # simulate n secs
