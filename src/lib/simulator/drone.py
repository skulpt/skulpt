'''
Created on 07.02.2014

@author: tatsch
'''
import numpy as np

#Drone layout
#
#          1 O
#            |
#        x ^ |
#          | |
#            |          4
# O----------+----------O
# 2   <--    |
#      y     |
#            |
#            |
#            O 3

class Drone():
    '''
    Model the drone
    '''

    #As in "Modeling Ardrone"
    L = 0.18  # distance between prop and COG in m
    m = 436.5  # mass of the drone in g
    g = 980.66  # gm/s^2
    I = np.array([[2.04016E-2, 0, 0],
                  [0, 1.56771E-2, 0],
                  [0, 0, 3.51779E-2]])  # inertia matrix of the drone in gm3

    k_b = 3.29E-11 # drag coefficient Nm/rpm2
    k_t =  1.27E-7  # torque coefficient
    kd = 0.1  # air friction coefficent of the whole ardrone,

    #As in Hector Quadrotor Simulator
    #Psi:  0.007242179827506
    #J_M: 2.573048063300000e-5 #inertia Motor
    #R_A: 0.201084219222241 #resistance motor
    #k_t: 0.015336864714397 #m_m=k_t*T
    #k_m: -7.011631909766668e-5
    #alpha_m: 0.104863758313889
    #beta_m: 0.549262344777900
    #CT2s: -1.3077e-2 #Thrust koefficients k_t from a  quadratic model
    #CT1s: -2.5224e-4
    #CT0s:  1.538190483976698e-5
    #l_m: 0.275

    L = 0.18  # distance between prop and COG in m
    m = 0.4365  # mass of the drone in kg, for hovering 5.8 A
    g = 9.81  # gm/s^2
    I = np.array([[2.5730480633e-8, 0, 0],
                  [0, 2.573048063300000e-8, 0],
                  [0, 0, 2.573048063300000e-5]])  # inertia matrix of the drone in gm3
    I = np.array([[0.007, 0, 0],
                  [0, 0.007, 0],
                  [0, 0, 0.012]])  # inertia matrix of the drone in gm3
    k_b = 0.1 # drag coefficient Nm/rpm2
    k_t =  0.73  # thrust coefficient in g/
    kd = 0.12  # air friction coefficent of the whole ardrone,

    x = np.array([[0.0],
                  [0.0],
                  [0.0]])
    xdot = np.zeros((3, 1))
    xdoubledot = np.zeros((3, 1))

    theta = np.zeros((3, 1))
    theta_body = np.zeros((3, 1))
    thetadot = np.zeros((3, 1))
    thetadoubledot = np.zeros((3, 1))

    def __init__(self):
        self.I_inv = np.linalg.inv(self.I)

        # K matrix is diagonal containing constants
        # A matrix is allocation matrix describing configuration of quadrotor

        k = self.k_t
        kL = k * self.L
        b = self.k_b
        m = self.m
        Ixx = self.I.item((0, 0))
        Iyy = self.I.item((1, 1))
        Izz = self.I.item((2, 2))

        # matrix to compute torques/moments and thrust from motor inputs
        self.KA = np.array([[0.0,kL,0.0,-kL],[kL,0.0,-kL,0.0],[b,-b,b,-b],[k,k,k,k]])
        #self.KA = np.array([[0,-kL,0,kL],[kL,0,-kL,0],[b,-b,b,-b],[k,k,k,k]]);
        # matrix to compute motor inputs from desired angular acceleration and thrust
        self.AinvKinvI = np.array([[0.0,Iyy/(2.0*kL),Izz/(4.0*b),m/(4.0*k)],[Ixx/(2.0*kL),0.0,-Izz/(4.0*b),m/(4.0*k)],[0.0,-Iyy/(2.0*kL),Izz/(4.0*b),m/(4.0*k)],[-Ixx/(2.0*kL),0.0,-Izz/(4.0*b),m/(4.0*k)]])
        #self.AinvKinvI = np.array([[0,Iyy/(2*kL),Izz/(4*b),m/(4*k)],[-Ixx/(2*kL),0,-Izz/(4*b),m/(4*k)],[0,-Iyy/(2*kL),Izz/(4*b),m/(4*k)],[Ixx/(2*kL),0,-Izz/(4*b),m/(4*k)]]);


        # H configuration
        #self.KA = np.array([[kL,kL,-kL,-kL],[kL,-kL,-kL,kL],[-b,b,-b,b],[k,k,k,k]])
        #self.AinvKinvI = np.array([[Ixx/(4*kL),Iyy/(4*kL),-Izz/(4*b),m/(4*k)],[Ixx/(4*kL),-Iyy/(4*kL),Izz/(4*b),m/(4*k)],[-Ixx/(4*kL),-Iyy/(4*kL),-Izz/(4*b),m/(4*k)],[-Ixx/(4*kL),Iyy/(4*kL),Izz/(4*b),m/(4*k)]])

        self.K = np.array([[kL, 0, 0, 0],
                           [0, kL, 0, 0],
                           [0,  0, b, 0],
                           [0,  0, 0, k]])

        self.A = np.array([[ 1, 1,-1,-1],
                           [ 1,-1,-1, 1],
                           [-1, 1,-1, 1],
                           [ 1, 1, 1, 1]])

        tmp = np.array([[Ixx, 0, 0, 0],
                        [0, Iyy, 0, 0],
                        [0, 0, Izz, 0],
                        [0, 0, 0, m  ]])

        self.KA = np.dot(self.K, self.A);
        self.AinvKinvI = np.dot(np.dot(np.linalg.inv(self.A), np.linalg.inv(self.K)), tmp)

        # corke tutorial
        #self.KA = np.array([[0,kL,0,-kL],[-kL,0,kL,0],[-b,b,-b,b],[k,k,k,k]]);
        #self.AinvKinvI = np.array([[0,-Iyy/(2*kL),-Izz/(4*b),m/(4*k)],[Ixx/(2*kL),0,Izz/(4*b),m/(4*k)],[0,Iyy/(2*kL),-Izz/(4*b),m/(4*k)],[-Ixx/(2*kL),0,Izz/(4*b),m/(4*k)]]);

        pass

    def angle_rotation_to_body(self):
        '''
        compute rotation matrix to convert angular velocities to body frame
        '''
        from math import sin, cos

        phi = self.theta.item(0);
        theta = self.theta.item(1);

        #return np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]])

        return np.array([[1, 0, -sin(theta)],
                      [0, -cos(phi), cos(theta) * sin(phi)],
                      [0, sin(phi), cos(theta) * cos(phi)]])


    def yaw_rotation(self):
        '''
        compute rotation matrix to convert angular velocities to body frame
        '''
        from math import sin, cos

        psi = self.theta.item(2);
        cpsi = cos(psi)
        spsi = sin(psi)
        return np.array([[cpsi, -spsi, 0],
                      [spsi, cpsi, 0],
                      [0, 0, 1]])

    def angle_rotation_to_world(self):
        '''
        compute rotation matrix to convert angular velocities to world frame
        '''
        from math import sin, cos, tan, fabs

        phi = self.theta.item(0);
        theta = self.theta.item(1);
        #return np.array([[1, 0, 0], [0, 1, 0], [0, 0, 1]])

        return np.array([[1, sin(phi) * tan(theta), cos(phi) * tan(theta)],
                      [0, cos(phi), -sin(phi)],
                      [0, sin(phi) / cos(theta), cos(phi) / cos(theta)]])

    def theta_in_body(self):
        return np.dot(self.angle_rotation_to_body(), self.theta)

    def thetadot_in_body(self):
        return np.dot(self.angle_rotation_to_body(), self.thetadot)

    def torques_thrust(self, inputs):
        return np.dot(self.KA, inputs)

    # Compute motor torques, given the current input currents, length, drag coefficient, and thrust coefficients
    def torques(self, inputs):
        mu = np.array([[self.L * self.k_t, 0,                 0],
                       [0,              self.L * self.k_t,    0],
                       [0,              0,                  self.k_b]])
        inp = np.array([[inputs[0] - inputs[2]],
                        [inputs[1] - inputs[3]],
                        [inputs[0] - inputs[1] + inputs[2] - inputs[3]]])
        tau = np.dot(mu, inp)
        return tau

    def thrust(self, inputs):
        T = np.array([[0], [0], [self.k_t * sum(inputs)]])
        return T

    def rotation(self):  # translate angles to intertial/world frame
        import math
        phi = self.theta.item(0)
        theta = self.theta.item(1)
        psi = self.theta.item(2)

        c_phi = math.cos(phi);
        s_phi = math.sin(phi);
        c_theta = math.cos(theta);
        s_theta = math.sin(theta);
        c_psi = math.cos(psi)
        s_psi = math.sin(psi)

        #ZYZ Euler nach Paper
        #R = np.array([[c_phi * c_psi - c_theta * s_phi * s_psi, -c_psi * s_phi - c_phi * c_theta * s_psi, s_theta * s_psi],
        #              [c_theta * c_psi * s_phi + c_phi * s_psi, c_phi * c_theta * c_psi - s_phi * s_psi,  -c_psi * s_theta],
        #              [s_phi * s_theta, c_phi * s_theta, c_theta]])
        # Master thesis XYZ
        R = np.array([[c_psi * c_theta, c_psi * s_theta * s_phi - s_psi * c_phi, c_psi * s_theta * c_phi + s_psi * s_phi],
                      [s_psi * c_theta, s_psi * s_theta * s_phi + c_psi * c_phi, s_psi * s_theta * c_phi - c_psi * s_phi],
                      [-s_theta, c_theta * s_phi, c_theta * c_phi]])

        #ZYZ Euler nach craig
        #R = np.array([[math.cos(psi)*math.cos(theta)*math.cos(phi)-math.sin(psi)*math.sin(phi), -math.cos(psi)*math.cos(theta)*math.sin(phi)-math.sin(psi)*math.cos(phi), math.cos(psi)*math.sin(theta) ],
        #              [math.sin(psi)*math.cos(theta)*math.cos(phi)+math.cos(psi)*math.sin(phi), -math.sin(psi)*math.cos(theta)*math.sin(phi)+math.cos(psi)*math.cos(phi), math.sin(psi)*math.sin(theta) ],
        #              [-math.sin(theta)*math.cos(phi), math.sin(theta)*math.sin(phi), math.cos(theta)]])

        return R
