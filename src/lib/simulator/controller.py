'''
Created on 07.02.2014

@author: tatsch
'''

import math
import numpy as np

class Controller():
    '''
    Implements a PIDController
    '''
    #Controller gains, tuned by hand and intuition.
    Kd = 4 #4
    Kp = 3 #3
    Ki = 3.5 #5.5
    dt = 0.005
    
    def __init__(self, drone):
        self.drone=drone
        self.errorIntegral=np.array([[0], [0], [0]])
        
    def calculate_control_command(self,thetaDesired,thetadotDesired,thetadoubledotDesired):

        print("P: %s" % (self.Kp*(thetaDesired-self.drone.theta)))
        print("I: %s" % (self.Ki*self.errorIntegral))
        print("D: %s" % (self.Kd*(self.drone.thetadot-thetadotDesired)))

        error=self.Kp*(thetaDesired-self.drone.theta)+self.Kd*(self.drone.thetadot-thetadotDesired)-self.Ki*self.errorIntegral
        self.errorIntegral=self.errorIntegral+self.dt*error
        print("Error: %s" % (error))
        print("ErrorIntegral: %s" % (self.errorIntegral))
        
        e_phi=error.item(0)
        e_theta=error.item(1)
        e_psi=error.item(2)        

        I_xx=self.drone.I.item((0, 0))
        I_yy=self.drone.I.item((1, 1))
        I_zz=self.drone.I.item((2, 2))
        print("Type should be")
        print(type(1.3))
        print("Type is")
        print(type(self.drone.theta.item(1)))
        print(math.cos(self.drone.theta.item(1)))
    
        qtt=(self.drone.m*self.drone.g)/(4*self.drone.k*math.cos(self.drone.theta.item(1))*math.cos(self.drone.theta.item(0)))
        gamma1=qtt-(2*self.drone.b*e_phi*I_xx+e_psi*I_zz*self.drone.k*self.drone.L)/4*self.drone.b*self.drone.k*self.drone.L
        gamma2=qtt+e_psi*I_zz/4*self.drone.b-e_theta*I_yy/2*self.drone.k*self.drone.L
        gamma3=qtt-(-2*self.drone.b*e_phi*I_xx+e_psi*I_zz*self.drone.k*self.drone.L)/4*self.drone.b*self.drone.k*self.drone.L
        gamma4=qtt+e_psi*I_zz/4*self.drone.b+e_theta*I_yy/2*self.drone.k*self.drone.L
        
        print(gamma1,gamma2,gamma3,gamma4)

        return [gamma1,gamma2,gamma3,gamma4]