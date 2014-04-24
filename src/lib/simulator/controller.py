import math
import numpy as np

#when more order types are needed, a 'Order' superclass should be used

class RelativeOrder(object):
    def __init__(self, dx, dy, dz, dyaw):
        #relative movements
        self.dx = dx
        self.dy = dy
        self.dz = dz

        self.dyaw = (dyaw / 180.0) * math.pi

class MissionPlanner:
    def __init__(self):
        self.commands = []

    def forward(self, distance):
        return self._add_relative_command(distance, 0, 0, 0)

    def backward(self, distance):
        return self._add_relative_command(-distance, 0, 0, 0)

    def left(self, distance):
        return self._add_relative_command(0, distance, 0, 0)

    def right(self, distance):
        return self._add_relative_command(0, -distance, 0, 0)

    def up(self, distance):
        return self._add_relative_command(0, 0, distance, 0)

    def down(self, distance):
        return self._add_relative_command(0, 0, -distance, 0)

    def turn_left(self, angle):
        return self._add_relative_command(0, 0, 0, angle)

    def turn_right(self, angle):
        return self._add_relative_command(0, 0, 0, -angle)

    def _add_relative_command(self, dx, dy, dz, dyaw):
        self.commands.append(RelativeOrder(dx, dy, dz, dyaw))
        return self

    def add_commands(self, commands):
        #perform typecheck of appended commands
        for command in commands:
            if not isinstance(command, RelativeOrder):
                raise Exception("you can only add relative movement orders to the mission.")
        self.commands += commands


class PositionController:
    command_queue     = []
    command_queue_idx = -1

    setpoint_position = np.array([[0], [0], [0]])
    setpoint_yaw      = 0.0
    done              = False

    Kp_pos = 1.0
    Kd_pos = 1.0

    Kp_yaw = 2.0
    Kd_yaw = 4.0

    Limit_xy = 2.0
    Limit_z  = 0.5

    def __init__(self, drone, commands, do_log):
        self.drone         = drone
        self.command_queue = commands
        self.do_log        = do_log

    def distance_to_setpoint(self):
        pos_diff = self.setpoint_position - self.drone.x
        yaw_diff = 5 * (self.setpoint_yaw - self.drone.theta.item(2))

        return math.sqrt(np.dot(pos_diff.transpose(), pos_diff).item(0) + yaw_diff * yaw_diff)

    def update_setpoint(self, delta):
        world_delta            = np.dot(self.drone.yaw_rotation(), np.array([[delta.dx], [delta.dy], [delta.dz]]))
        self.setpoint_position = self.setpoint_position + world_delta
        self.setpoint_yaw     += delta.dyaw

    def clamp(self, value, limit):
        return max(min(value, limit), -limit)

    def compute_input(self):
        if self.done:
            return [0, 0, 0], 0;

        if self.command_queue_idx < 0 or self.distance_to_setpoint() < 0.05:
            self.command_queue_idx += 1

            if self.command_queue_idx < len(self.command_queue):
                self.update_setpoint(self.command_queue[self.command_queue_idx])
                if self.do_log:
                    print "updating setpoint, position:", self.setpoint_position.transpose(), "yaw:", self.setpoint_yaw
            else:
                self.done = True
                if self.do_log:
                    print "done"

        lin_vel_cmd = self.Kp_pos * (self.setpoint_position - self.drone.x) - self.Kd_pos * self.drone.xdot;
        yaw_vel_cmd = self.Kp_yaw * (self.setpoint_yaw - self.drone.theta.item(2)) - self.Kd_yaw * self.drone.thetadot.item(2)

        return [
            self.clamp(lin_vel_cmd.item(0), self.Limit_xy),
            self.clamp(lin_vel_cmd.item(1), self.Limit_xy),
            self.clamp(lin_vel_cmd.item(2), self.Limit_z)
        ], yaw_vel_cmd


class Controller():
    '''
    Implements a PIDController
    '''

    Kp_xy = 1
    Kd_xy = 1
    Ki_xy = 0

    Kp_roll = 3
    Kd_roll = 9
    Ki_roll = 0

    Kp_pitch = 3
    Kd_pitch = 9
    Ki_pitch = 0

    Kp_yaw = 1
    Kd_yaw = 1
    Ki_yaw = 0

    Kp_z = 1
    Kd_z = 1
    Ki_z = 0

    agressiveness_xy = 0.3
    agressiveness_z  = 0.3

    dt = 0.005

    def __init__(self, drone):
        self.drone         = drone
        self.errorIntegral = np.array([[0], [0], [0]])

        # TODO: tune gains
        self.Kp_angular_rate = np.array([[3.0], [3.0], [1.0]])
        self.Kp_attitude     = np.array([[5.0], [5.0], [1.0]])
        self.Kd_attitude     = np.array([[0.0], [0.0], [0.0]])
        self.Kp_zvelocity    = 5.0

        self.Kp_lin_vel = np.array([[5.0], [5.0], [5.0]])
        self.Kd_lin_vel = np.array([[2.5], [2.5], [0]])

        self.Kp_ang_vel = 10.0
        self.Kd_ang_vel = 5.0

        self.Kp_yaw_vel = 1.0


    def calculate_control_command3(self,dt,xdot_desired, yawdot_desired):

        world_acc_cmd    = self.Kp_lin_vel * (xdot_desired - self.drone.xdot) - self.Kd_lin_vel * self.drone.xdoubledot;
        world_acc_cmd[2] = world_acc_cmd.item(2) + self.drone.g# / (math.cos(self.drone.theta.item(1))*math.cos(self.drone.theta.item(0)))
        #print "world", world_acc_cmd.transpose()
        body_acc_cmd     = np.dot(self.drone.rotation().transpose(), world_acc_cmd)
        body_angular_vel = self.drone.omega#np.dot(self.drone.angle_rotation_to_body(), self.drone.thetadot)
        #print "body", body_angular_vel.transpose()

        rates = np.array([
            [self.Kp_ang_vel * (-body_acc_cmd.item(1) / self.drone.g) - self.Kd_ang_vel * body_angular_vel.item(0)],
            [self.Kp_ang_vel * (body_acc_cmd.item(0) / self.drone.g) - self.Kd_ang_vel * body_angular_vel.item(1)],
            [self.Kp_yaw_vel * (yawdot_desired - self.drone.thetadot.item(2))]
        ]);

        T_des = world_acc_cmd.item(2) / (math.cos(self.drone.theta.item(1)) * math.cos(self.drone.theta.item(0)))
        rates = np.vstack((rates, T_des))
        ctrl  = np.dot(self.drone.AinvKinvI, rates)
        return ctrl, world_acc_cmd

    def calculate_control_command(self,dt,theta_desired,thetadot_desired,x_desired,xdot_desired):
        # TODO: implement z velocity controller feeding to desired thrust

        T_des = self.drone.g / (math.cos(self.drone.theta.item(1))*math.cos(self.drone.theta.item(0)));
        T_des += self.Kp_zvelocity * (xdot_desired.item(2) - self.drone.xdot.item(2))
        #print "T_des",T_des
        # attitude controller

        # angular loop
        #thetadot_desired = self.Kp_attitude * (np.dot(self.drone.yaw_rotation(), theta_desired) - self.drone.theta)# - self.Kd_attitude * self.drone.thetadot;
        thetadot_desired = self.Kp_attitude * (theta_desired - self.drone.theta);
        #print (theta_desired - self.drone.theta_in_body()).transpose(), thetadot_desired.transpose()

        thetadot_desired[2] = theta_desired.item(2)

        #print self.drone.theta.transpose(), self.drone.theta_in_body().transpose(), thetadot_desired.transpose(), self.drone.thetadot.transpose(), self.drone.thetadot_in_body().transpose();
        #print "err",(theta_desired - self.drone.theta_in_body()).transpose(), theta_desired.transpose(), self.drone.theta_in_body().transpose(), self.drone.theta.transpose()
        # angular rate controller
        #rates = self.Kp_angular_rate * (thetadot_desired - self.drone.thetadot)
        rates = self.Kp_angular_rate * (np.dot(self.drone.angle_rotation_to_body(), thetadot_desired) - self.drone.thetadot_in_body())
        #print (thetadot_desired - self.drone.thetadot_in_body()).transpose(), rates.transpose()
        #print "theta_desired", theta_desired
        #print "self.drone.theta_in_body()", self.drone.theta_in_body()
        #print "thetadot_desired",thetadot_desired
        #print "self.drone.thetadot",self.drone.thetadot
        #print "self.drone.thetadot_in_body()",self.drone.thetadot_in_body()
        rates = np.vstack((rates, T_des))
        #rates[0] = (rates[0] if rates[0] <= 1 else 1) if rates[0] >= -1 else -1;
        #rates[1] = (rates[1] if rates[1] <= 1 else 1) if rates[1] >= -1 else -1;
        #rates[2] = (rates[2] if rates[2] <= 1 else 1) if rates[2] >= -1 else -1;
        #rates[3] = (rates[3] if rates[3] <= 12 else 12) if rates[2] >= 8 else 8;
        #print "rates1",type(rates.item(3)),rates.item(3)
        #print "rates2",rates
        #print "self.drone.AinvKinvI", self.drone.AinvKinvI
        ctrl = np.dot(self.drone.AinvKinvI, rates);
        #print rates.transpose(), np.dot(self.drone.KA, ctrl).transpose(), ctrl.transpose();
        #ctrl = np.min(np.hstack((ctrl, np.array([[8.0], [8.0], [8.0], [8.0]]))), 1)[:,None];
        #print "r", rates.transpose(), ctrl.transpose();
        #print "ctrl", ctrl
        return ctrl

    def calculate_control_command2(self, dt, theta_desired, thetadot_desired, x_desired, xdot_desired):
        #xy control
        e_x = x_desired.item(0) - self.drone.x.item(0) + xdot_desired.item(0) - self.drone.xdot.item(0)
        e_y = x_desired.item(1) - self.drone.x.item(1) + xdot_desired.item(1) - self.drone.xdot.item(1)

        position_cmd = self.Kp_xy*(x_desired-self.drone.x)+self.Kd_xy*(xdot_desired-self.drone.xdot)
        u_x          = position_cmd.item(0)
        u_y          = position_cmd.item(1)

        R = np.array([[math.cos(self.drone.theta.item(2)), -math.sin(self.drone.theta.item(2))],
                      [math.sin(self.drone.theta.item(2)),  math.cos(self.drone.theta.item(2))]])
        u_local = np.dot(R, np.array([[u_x], [u_y]]))

        #theta_desired[0] = u_local.item(0)*self.agressiveness_xy
        #theta_desired[1] = u_local.item(1)*self.agressiveness_xy

        #yaw control
        e_yaw             = theta_desired.item(2) - self.drone.theta.item(2) #+thetadot_desired.item(2)-self.drone.thetadot.item(2)
        u_yaw             = self.Kp_yaw * (theta_desired.item(2) - self.drone.theta.item(2)) + self.Kd_yaw * (thetadot_desired.item(2)-self.drone.thetadot.item(2))
        #theta_desired[2] = math.atan2(math.sin(u_yaw), math.cos(u_yaw));
        e_yaw_norm        = -u_yaw #-math.atan2(math.sin(u_yaw), math.cos(u_yaw));
        # TODO: handle flips from +pi to -pi

        #altitude control
        e_altitude = self.Kp_z * (x_desired.item(2) - self.drone.x.item(2)) + self.Kd_z * (xdot_desired.item(2) - self.drone.xdot.item(2))
        e_z        = x_desired.item(2)-self.drone.x.item(2)+xdot_desired.item(2)-self.drone.xdot.item(2)
        print "z err:", e_altitude, x_desired.item(2), self.drone.x.item(2)
        qtt        = (self.drone.m * self.drone.g) / (4 * self.drone.k_t * math.cos(self.drone.theta.item(1)) * math.cos(self.drone.theta.item(0)))
        qtt        = (1 + e_altitude * self.agressiveness_z) * qtt

        e_roll  = self.Kp_roll * (theta_desired.item(0) - self.drone.theta.item(0)) + self.Kd_roll * (thetadot_desired.item(0) - self.drone.thetadot.item(0))
        e_roll  = -e_roll
        e_pitch = self.Kp_pitch * (theta_desired.item(1) - self.drone.theta.item(1)) + self.Kd_pitch * (thetadot_desired.item(1) - self.drone.thetadot.item(1))
        e_pitch = -e_pitch

        print "errors", e_roll, e_pitch, e_yaw_norm

        I_xx = self.drone.I.item((0, 0))
        I_yy = self.drone.I.item((1, 1))
        I_zz = self.drone.I.item((2, 2))
        #print I_xx, I_yy, I_zz
        #roll hat irgendwie keine wirkung

        #gamma = angular_velocity_motor^2
        b = self.drone.k_b
        t = self.drone.k_t
        L = self.drone.L

        gamma1 = qtt - ((2 * b * e_roll * I_xx + e_yaw_norm * I_zz * t * L) / (4 * b * t * L))
        gamma2 = qtt + ((e_yaw_norm * I_zz) / (4 * b)) - ((e_pitch * I_yy) / (2 * t * L))
        gamma3 = qtt - ((-2 * b * e_roll * I_xx + e_yaw_norm * I_zz * t * L) / (4 * b * t * L))
        gamma4 = qtt + ((e_yaw_norm * I_zz) / (4 * b)) + ((e_pitch * I_yy) / (2 * t * L))

        #Make sure we don't get above 10 Ampere in total, the rating of the Ardrone 2.0 Battery
        #@ Hovering 5.95A
        #control_commands=[abs(gamma1),abs(gamma2),abs(gamma3),abs(gamma4)]
        #if (sum(control_commands)>7):
        #    print(sum(control_commands));
        #
        #    gamma1 = (gamma1/max(control_commands))*2.4
        #    gamma2 = (gamma2/max(control_commands))*2.4
        #    gamma3 = (gamma3/max(control_commands))*2.4
        #    gamma4 = (gamma4/max(control_commands))*2.4
        #    print("New controls:")
        #    print(gamma1,gamma2,gamma3,gamma4)

        return ([gamma1, gamma2, gamma3, gamma4], e_x, e_y, e_z, e_yaw, theta_desired.item(0), theta_desired.item(1), theta_desired.item(2))
