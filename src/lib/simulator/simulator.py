'''
Created on 07.02.2014

@author: tatsch
'''
import sys
import math
import numpy as np  # for cross, inv, random, arange

if(sys.platform != "skulpt"):
    import matplotlib.pyplot as plt
    from mpl_toolkits.mplot3d import Axes3D

class Simulator():
    
    start_time = 0  # in secs
    end_time = 10
    dt = 0.005

    
    def __init__(self, drone, controller):
        self.drone = drone
        self.controller = controller

        self.x = []
        self.y = []
        self.z = []
        
        self.roll = []
        self.pitch = []
        self.yaw = []
    
    def simulate(self, duration):
        self.end_time = duration
        thetaDesired = np.array([[0], [0], [0]])
        thetadotDesired = np.array([[0], [0], [0]])
        thetadoubledotDesired = np.array([[0], [0], [0]])
        # Step through the simulation, updating the drone state.
        t=self.start_time
        while t <= self.end_time:
            inputCurrents = self.controller.calculate_control_command(thetaDesired, thetadotDesired, thetadoubledotDesired)
            print("inputCurrents:")
            print(inputCurrents)
            linearAcceleration = self.linear_acceleration(inputCurrents, self.drone.theta, self.drone.xdot)  # calculate the resulting linear acceleration
            omega = self.thetadot2omega(self.drone.thetadot, self.drone.theta)  # calculate current angular velocity

            omegadot = self.angular_acceleration(inputCurrents, omega)  # calculate resulting angular acceleration
    
            omega = omega + self.dt * omegadot  # integrate up new angular velocity
            thetadotOld = self.drone.thetadot
            self.drone.thetadot = self.omega2thetadot(omega, self.drone.theta)  # calculate roll,pitch,yaw velocities
            # self.drone.thetadoubledot=(self.drone.thetadoubledot-thetadotOld)/self.dt
            self.drone.theta = self.drone.theta + self.dt * self.drone.thetadot  # integrate up to roll,pitch,yaw
            self.drone.xdot = self.drone.xdot + self.dt * linearAcceleration  # integrate up to drone speed
            self.drone.x = self.drone.x + self.dt * self.drone.xdot  # integrate up to drone position
            print("Position at step ")
            print(t)
            print(self.drone.x)

            self.x.append(self.drone.x.item(0))
            self.y.append(self.drone.x.item(1))
            self.z.append(self.drone.x.item(2))
            self.roll.append(self.drone.theta.item(0))
            self.pitch.append(self.drone.theta.item(1))
            self.yaw.append(self.drone.theta.item(2))
            t += self.dt
        
        if(sys.platform != "skulpt"):
            fig1 = plt.figure(1)
            fig1.suptitle('Position x,y,z')
            # fig1.add_title('Position x,y,z')
            ax = fig1.add_subplot(111, projection='3d')
            ax.plot(self.x, self.y, self.z)
            fig1.show()
            fig2, (ax1, ax2, ax3) = plt.subplots(3, sharex=True, sharey=True)
            ax1.plot(self.roll)
            fig2.suptitle('Position roll, pitch, yaw')
            ax2.plot(self.pitch)
            ax3.plot(self.yaw)
            fig2.show()
            raw_input()
        
    def deg2rad(self,degrees):
        return np.array(map(math.radians, degrees))
        
    def rotation(self, angles):  # translate angles to intertial/world frame
        phi = angles.item(0)
        theta = angles.item(1)
        psi = angles.item(2)
        R = np.array([[math.cos(phi) * math.cos(psi) - math.cos(theta) * math.sin(phi) * math.sin(psi), -math.cos(psi) * math.sin(phi) - math.cos(phi) * math.cos(theta) * math.sin(psi), math.sin(theta) * math.sin(psi)], [math.cos(theta) * math.cos(psi) * math.sin(phi) + math.cos(phi) * math.sin(psi), math.cos(phi) * math.cos(theta) * math.cos(psi) - math.sin(phi) * math.sin(psi), -math.cos(psi) * math.sin(theta)], [math.sin(phi) * math.sin(theta), math.cos(phi) * math.sin(theta), math.cos(theta)]])
        return R
    
    def linear_acceleration(self, inputs, angles, xdot):
        gravity = np.array([[0], [0], [-self.drone.g]])
        R = self.rotation(angles)
        T = np.dot(R, self.drone.thrust(inputs))
        F_drag = -self.drone.kd * xdot
        a = gravity + 1 / self.drone.m * T + F_drag
        return a
        
    def angular_acceleration(self, inputs, omega):
        tau = self.drone.torques(inputs);
        omegaddot = np.dot(np.linalg.inv(self.drone.I), (tau - np.cross(omega.transpose(), np.dot(self.drone.I, omega).transpose()).transpose()));
        return omegaddot
    
    def thetadot2omega(self, thetadot, theta):
        R = np.array([[1, -math.sin(theta.item(1)), 0], [0, math.cos(theta.item(0)), math.cos(theta.item(1)) * math.sin(theta.item(0))], [0, -math.sin(theta.item(0)), math.cos(theta.item(1)) * math.cos(theta.item(0))]])
        omega = np.dot(R, thetadot)
        return omega
    
    def omega2thetadot(self, omega, theta):
        R = np.array([[1, -math.sin(theta.item(1)), 0], [0, math.cos(theta.item(0)), math.cos(theta.item(1)) * math.sin(theta.item(0))], [0, -math.sin(theta.item(0)), math.cos(theta.item(1)) * math.cos(theta.item(0))]])
        thetadot = np.dot(np.linalg.inv(R), omega)
        return thetadot
