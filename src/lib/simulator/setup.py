'''
Created on 07.02.2014

@author: tatsch
'''

def setup():
    from simulator.controller import Controller
    from simulator.drone import Drone
    from simulator.simulator import Simulator
    import numpy as np;
    
    drone = Drone()
    angular_disturbance = np.array([[0.03], [0.02], [0.1]])
    drone.thetadot = angular_disturbance  # Simulate some disturbance in the angular velocity.
    controller = Controller(drone)
    simulator = Simulator(drone,controller)
    
    return simulator;
