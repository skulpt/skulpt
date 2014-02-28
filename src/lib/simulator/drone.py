'''
Created on 07.02.2014

@author: tatsch
'''
import numpy as np

class Drone():
    '''
    Model the drone
    '''
    L = 0.18  # distance between prop and COG
    m = 0.4365  # mass of the drone in kg
    g = 9.81  # 9.81m/s^2 
    I = np.array([[2.04016E-5, 0, 0], [0, 1.56771E-5, 0], [0, 0, 3.51779E-5]])  # inertia matrix of the drone in kgm3
    b = 0.02  # drag coefficient, what does it do????rotor blade, should be magnitudes smaller
    k = 0.214  # thrust coefficient in kg/rpm2, should be 9.14E-8
    kd = 0.5  # air friction coefficent of the whole ardrone,
    x = np.array([[0], [0], [10]])
    xdot = np.zeros((3, 1))
    theta = np.zeros((3, 1))
    thetadot = np.zeros((3, 1))
    thetadoubledot = np.zeros((3, 1))

    
    def __init__(self):
        pass
    
    # Compute motor torques, given the current input currents, length, drag coefficient, and thrust coefficients
    def torques(self, inputs):
        mu = np.array([[self.L * self.k, 0, 0], [0, self.L * self.k, 0], [0, 0, self.b]])
        inp = np.array([[inputs[0] - inputs[2]], [inputs[1] - inputs[3]], [inputs[0] - inputs[1] + inputs[2] - inputs[3]]])
        tau = np.dot(mu, inp)
        return tau
    
    def thrust(self, inputs):
        T = np.array([[0], [0], [self.k * sum(inputs)]])
        return T
