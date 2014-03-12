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
    dt = 0.1

    
    def __init__(self, drone, controller):
        self.drone = drone
        self.controller = controller
        
        if(sys.platform != "skulpt"):
            self.x = []
            self.y = []
            self.z = []
            self.roll = []
            self.pitch = []
            self.yaw = []
            self.cmd1 =[]
            self.cmd2 =[]
            self.cmd3 =[]
            self.cmd4 =[]
            self.e_phi=[]
            self.e_theta=[]
            self.e_psi=[]
    
    def reset(self):
        self.thetaDesired = np.array([[0], [0], [0]])
        self.thetadotDesired = np.array([[0], [0], [0]])
        self.thetadoubledotDesired = np.array([[0], [0], [0]])
        self.drone.x = np.array([[0],[0],[0]])
        # TODO: reset all states
    
    def get_drone_pose(self):
        return [self.drone.x.item(0), self.drone.x.item(1), self.drone.x.item(2), self.drone.theta.item(0), self.drone.theta.item(1), self.drone.theta.item(2)];
    
    def simulate_step(self, t, dt):

        inputCurrents,e_phi, e_theta, e_psi = self.controller.calculate_control_command(self.thetaDesired, self.thetadotDesired, self.thetadoubledotDesired)

        linear_acceleration = self.linear_acceleration(inputCurrents, self.drone.theta, self.drone.xdot)  # calculate the resulting linear acceleration
        omega = self.thetadot2omega(self.drone.thetadot, self.drone.theta)  # calculate current angular velocity
        omegadot = self.angular_acceleration(inputCurrents, omega)  # calculate resulting angular acceleration
        omega = omega + self.dt * omegadot  # integrate up new angular velocity
        self.drone.thetadot = self.omega2thetadot(omega, self.drone.theta)  # calculate roll, pitch, yaw velocities
        self.drone.theta = self.drone.theta + self.dt * self.drone.thetadot  # calculate new roll, pitch, yaw angles
        self.drone.xdot = self.drone.xdot + self.dt * linear_acceleration  # calculate new linear drone speed
        self.drone.x = self.drone.x + self.dt * self.drone.xdot  # calculate new drone position
        
        if(sys.platform != "skulpt"):#save trajectory for plotting
            self.x.append(self.drone.x.item(0))
            self.y.append(self.drone.x.item(1))
            self.z.append(self.drone.x.item(2))
            self.roll.append(self.drone.theta.item(0))
            self.pitch.append(self.drone.theta.item(1))
            self.yaw.append(self.drone.theta.item(2))
            self.cmd1.append(inputCurrents[0])
            self.cmd2.append(inputCurrents[1])
            self.cmd3.append(inputCurrents[2])
            self.cmd4.append(inputCurrents[3])
            self.e_phi.append(e_phi)
            self.e_theta.append(e_theta)
            self.e_psi.append(e_psi)
    
    def simulate(self, duration):
        self.end_time = duration
        self.reset();
        # Step through the simulation, updating the drone state.
        t=self.start_time
        while t <= self.end_time:
            self.simulate_step(t, self.dt)
            t += self.dt
        
        if(sys.platform != "skulpt"):
            fig1 = plt.figure(1)
            fig1.suptitle('Position x,y,z')
            ax = fig1.add_subplot(111, projection='3d')
            ax.plot(self.x, self.y, self.z)
            fig1.show()
            fig2, (ax1, ax2, ax3) = plt.subplots(3, sharex=True, sharey=True)
            ax1.plot(self.roll)
            fig2.suptitle('Position roll, pitch, yaw')
            ax2.plot(self.pitch)
            ax3.plot(self.yaw)
            fig2.show()
            fig3 = plt.figure()
            plt.title('Errors * gain')
            plt.plot(self.e_phi)
            plt.plot(self.e_theta)
            plt.plot(self.e_psi)
            plt.legend(['e_phi', 'e_theta', 'e_psi'], loc='upper left')
            fig3.show()
            fig4, (ax4, ax5, ax6, ax7) = plt.subplots(4, sharex=True, sharey=True)
            ax4.plot(self.cmd1)
            fig4.suptitle('Control Commands')
            ax5.plot(self.cmd2)
            ax6.plot(self.cmd3)
            ax7.plot(self.cmd4)
            fig4.show()
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
